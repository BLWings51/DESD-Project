from django.test import TestCase

# Create your tests here.
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Account, Society, FriendRelation, SocietyRelation, Event, EventRelation, Post, Notification
from django.utils import timezone
from datetime import timedelta

class FullSystemTest(APITestCase):

    def setUp(self):
        # Users
        self.user1 = Account.objects.create_user(accountID=1, email="user1@example.com", password="testpass", firstName="User", lastName="One")
        self.user2 = Account.objects.create_user(accountID=2, email="user2@example.com", password="testpass", firstName="User", lastName="Two", adminStatus=True)
        self.user3 = Account.objects.create_user(accountID=3, email="user3@example.com", password="testpass", firstName="User", lastName="Three")

        # Login
        res = self.client.post(reverse('token_obtain_pair'), {"accountID": self.user1.accountID, "password": "testpass"})
        self.assertEqual(res.status_code, 200)
        self.client.cookies['access_token'] = res.cookies['access_token'].value

    # --- AUTH + PROFILE TESTING ---
    def test_is_authenticated(self):
        res = self.client.post("/authenticated/")
        self.assertEqual(res.status_code, 200)

    def test_update_profile(self):
        res = self.client.post("/Profile/Settings/", {
            "bio": "Updated bio",
            "address": "New address",
            "email": "newemail@example.com"
        })
        self.assertEqual(res.status_code, 200)

    def test_profile_details_and_delete(self):
        res = self.client.get(f"/Profile/{self.user1.accountID}/")
        self.assertEqual(res.status_code, 200)

        res = self.client.delete("/Profile/Delete/")
        self.assertEqual(res.status_code, 204)

    # --- FRIENDS ---
    def test_friend_workflow(self):
        # Send
        res = self.client.post(f"/friends/send/{self.user2.accountID}/")
        self.assertEqual(res.status_code, 201)

        # Accept (switch to user2)
        self.client.cookies.clear()
        self.client.force_authenticate(self.user2)

        res = self.client.post(f"/friends/accept/{self.user1.accountID}/")
        self.assertEqual(res.status_code, 200)

        res = self.client.get("/friends/list/")
        self.assertEqual(len(res.data), 1)

        # Remove
        res = self.client.post(f"/friends/remove/{self.user1.accountID}/")
        self.assertEqual(res.status_code, 200)

    # --- SOCIETY ---
    def test_society_create_and_join(self):
        res = self.client.post("/Societies/CreateSociety/", {"name": "New Society", "description": "Desc"})
        self.assertEqual(res.status_code, 201)

        res = self.client.post("/Societies/New Society/join/")
        self.assertEqual(res.status_code, 200)

        res = self.client.get("/Societies/")
        self.assertEqual(res.status_code, 200)

        res = self.client.post("/Societies/New Society/leave/")
        self.assertEqual(res.status_code, 200)

    def test_duplicate_society_name(self):
        Society.objects.create(name="Duplicate", description="desc")
        res = self.client.post("/Societies/CreateSociety/", {"name": "Duplicate", "description": "desc"})
        self.assertEqual(res.status_code, 400)

    # --- EVENTS ---
    def test_event_create_and_join(self):
        society = Society.objects.create(name="Eventsoc", description="test")
        SocietyRelation.objects.create(society=society, account=self.user1, adminStatus=True)

        res = self.client.post("/Societies/Eventsoc/CreateEvent/", {
            "name": "Test Event",
            "details": "Details",
            "startTime": (timezone.now() + timedelta(days=1)).isoformat(),
            "endTime": (timezone.now() + timedelta(days=2)).isoformat(),
            "location": "Online"
        })
        self.assertEqual(res.status_code, 200)

        event = Event.objects.get(name="Test Event")

        res = self.client.post(f"/Societies/Eventsoc/{event.id}/Join/")
        self.assertEqual(res.status_code, 200)

        res = self.client.get(f"/Societies/Eventsoc/{event.id}/CheckInterest/")
        self.assertTrue(res.data["is_registered"])

        res = self.client.post(f"/Societies/Eventsoc/{event.id}/Leave/")
        self.assertEqual(res.status_code, 200)

    def test_event_invalid_dates(self):
        society = Society.objects.create(name="InvalidEventSoc", description="test")
        SocietyRelation.objects.create(society=society, account=self.user1, adminStatus=True)

        res = self.client.post("/Societies/InvalidEventSoc/CreateEvent/", {
            "name": "Invalid Date Event",
            "details": "Details",
            "startTime": (timezone.now() + timedelta(days=2)).isoformat(),
            "endTime": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "Somewhere"
        })
        self.assertEqual(res.status_code, 400)

    # --- POSTS ---
    def test_post_create_update_delete(self):
        society = Society.objects.create(name="Postsoc", description="desc")
        SocietyRelation.objects.create(society=society, account=self.user1)

        res = self.client.post("/Societies/Postsoc/posts/create/", {"content": "Hello World"})
        self.assertEqual(res.status_code, 201)
        post_id = res.data["id"]

        res = self.client.patch(f"/Societies/Postsoc/posts/update/{post_id}/", {"content": "Updated!"})
        self.assertEqual(res.status_code, 200)

        res = self.client.get(f"/Societies/Postsoc/posts/can_delete/{post_id}/")
        self.assertTrue(res.data["can_delete"])

        res = self.client.delete(f"/Societies/Postsoc/posts/delete/{post_id}/")
        self.assertEqual(res.status_code, 204)

    # --- NOTIFICATIONS ---
    def test_notifications(self):
        Notification.objects.create(recipient=self.user1, message="Test Notification")

        res = self.client.get("/notifications/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

        res = self.client.get("/notificationBell/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["quantity"], 1)

        notif_id = Notification.objects.get(recipient=self.user1).id
        res = self.client.post(f"/notifications/{notif_id}/")
        self.assertEqual(res.status_code, 200)

    # --- SEARCH ---
    def test_search(self):
        Society.objects.create(name="SearchSoc", description="desc")

        res = self.client.get("/search/?q=SearchSoc&type=society")
        self.assertEqual(res.status_code, 200)

