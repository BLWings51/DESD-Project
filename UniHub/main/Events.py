from django.shortcuts import render
from rest_framework.generics import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework.fields import DateTimeField
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .tasks import send_event_notification
from rest_framework import serializers
from .models import Event, Society, SocietyRelation, EventRelation, Notification, Account, ScheduledEventNotification, InterestTag
from .permissions import IsAdminOrSocietyAdmin
from datetime import timedelta
from celery import Celery
from celery.result import AsyncResult
from django.core.mail import send_mail
from django.utils.timezone import make_aware, is_naive
from django.utils.timezone import localtime
import datetime
from .signup import InterestTagSerializer

# creating an event
class CreateEventSerializer(serializers.ModelSerializer):
    interests = InterestTagSerializer(many=True, required=False)
    society = serializers.PrimaryKeyRelatedField(queryset=Society.objects.all(), write_only=True)

    
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location', 'online', 'interests', 'society']

    def create(self, validated_data):
        interests_data  = validated_data.pop('interests', [])
        society = validated_data.pop('society')
        event = Event.objects.create(society=society, **validated_data)
        
        tags = []
        for interest_data in interests_data:
            tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
            tags.append(tag)

        event.interests.set(tags)
        event.save()
        return event
    
    
def reschedule_event(event, newStartTime, user):
    scheduled_tasks = ScheduledEventNotification.objects.filter(event=event)
    for task in scheduled_tasks:
        AsyncResult(task.task_name).revoke(terminate=True)
        task.delete()

    if is_naive(newStartTime):
        newStartTime = make_aware(newStartTime)

    event.startTime = timezone.localtime(event.startTime)

    times = {
        "in 1 day": event.startTime - timedelta(days=1),
        "in 1 hour": event.startTime - timedelta(hours=1),
        "now": event.startTime + timedelta(hours=1),
        }

    print(f"event.startTime: {event.startTime}, timezone.now(): {timezone.now()}")
    for label, notify_time in times.items():
        print(f"Checking label '{label}' for time: {notify_time}")
        if label=="now":
            notify_time = notify_time - timedelta(hours=1)
        task = send_event_notification.apply_async(
            args=[user.id, event.id, label],
            eta = notify_time
        )
        ScheduledEventNotification.objects.create(
            user=user,
            event=event,
            notification_time=notify_time,
            task_name=task.id
        )



@api_view(['POST'])
@permission_classes([IsAdminOrSocietyAdmin])
def CreateEvent(request, society_name):
    society = get_object_or_404(Society, name=society_name)
    data = request.data.copy()
    data['society'] = society.id
    serializer = CreateEventSerializer(data=data)
    startTime = request.data.get('startTime')
    endTime = request.data.get('endTime')
    if endTime <= startTime:
        return Response({"error": "End date cannot be equal to or before the start date"}, status=400)
    if serializer.is_valid():
        serializer.save()
        members_list = SocietyRelation.objects.filter(society=society).values_list('account', flat=True)
        members = Account.objects.filter(id__in=members_list)
        for member in members:
            Notification.objects.create(recipient=member, message=f"{request.data.get('name')} was just created in {society.name}")
            local_start_time = localtime(event.startTime).strftime("%Y-%m-%d %H:%M")
            send_mail(
            subject=f"New Event That Might Interest You",
            message=f"Hi {member.firstName},\n\nA new event -'{request.data.get('name')}' - has been created in {society_name}.\n\nDetails:\n{request.data.get('details')}\nWhen: {local_start_time}\nWhere: {request.data.get('location')}\n\nThanks,\nUniHub Management",
            from_email=None,
            recipient_list=[member.email],
            fail_silently=False,
        )
        return Response(serializer.data)
    return Response(serializer.errors, status=400)
    

# retreiving data for every event within a society
class GetAllEventSerializer(serializers.ModelSerializer):
    interests = InterestTagSerializer(many=True)
    status = serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location', 'status', 'online', 'interests']

    def getEventDetails(self, event):
        eventDetails = {"id":event.id, "name":event.name, "details":event.details, "startTime":event.startTime, "endTime":event.endTime, "location":event.location, "status":event.status, "online":event.online, "interests":event.interests}
        return eventDetails

    def get_status(self, event):
        event.startTime = timezone.localtime(event.startTime)
        event.startTime = event.startTime - timedelta(hours=1)
        status = "none"
        if event.startTime <= timezone.now() <= event.endTime:
            status = "ongoing"
        elif event.endTime < timezone.now():
            status = "finished"
        elif event.startTime > timezone.now():
            status = "upcoming"
        return status 
        

        
@api_view(['GET'])
@permission_classes([AllowAny])
def getAllEvents(request, society_name):
    society = get_object_or_404(Society, name=society_name)
    events = Event.objects.filter(society=society)
    serializer = GetAllEventSerializer(events, many=True)
    return Response(serializer.data)

# deleting an event
@api_view(['DELETE'])
@permission_classes([IsAdminOrSocietyAdmin])
def deleteEvent(request, society_name, eventID):
    try:
        event = get_object_or_404(Event, id=eventID)
        society = get_object_or_404(Society, name=society_name)
        event_check = Event.objects.filter(id=event.id, society=society)
        if not event_check.exists():
            return Response({"error": f"{society.name} does not have this event"}, status=400)
        event.delete()
        return Response({"success":"true"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

#update events
class UpdateEventSerializer(serializers.ModelSerializer):
    interests = InterestTagSerializer(many=True, required=False)
    
    class Meta:
        model=Event
        fields = ['name', 'details', 'startTime', 'endTime', 'location']
    
    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if interests_data is not None:
            tags = []
            for interest_data in interests_data:
                tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
                tags.append(tag)
            instance.interests.set(tags)

        instance.save()
        return instance


@api_view(['POST'])
@permission_classes([IsAdminOrSocietyAdmin])
def UpdateEvent(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)
    event = get_object_or_404(Event, id=eventID)
    datetime_parser = DateTimeField()
    
    startTime = request.data.get("startTime", event.startTime)
    endTime = request.data.get("endTime", event.endTime)

    event_check = Event.objects.filter(id=event.id, society=society)
    if not event_check.exists():
        return Response({"error": f"{society.name} does not have this event"})

    try:
        if isinstance(startTime, str):
            startTime = datetime_parser.to_internal_value(startTime)
            reschedule_event(event, startTime, request.user)
        if isinstance(endTime, str):
            endTime = datetime_parser.to_internal_value(endTime)
    except Exception:
        return Response({"error": "Invalid date format"}, status=400)

    if endTime and startTime and endTime <= startTime:
        return Response({"error": "End date cannot be equal to or before the start date"}, status=400)
    serializer = UpdateEventSerializer(event, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        members_list = SocietyRelation.objects.filter(society=society).values_list('account', flat=True)
        members = Account.objects.filter(id__in=members_list)
        for member in members:
            Notification.objects.create(recipient=member, message=f"{event.name} was just updated in {society.name}")
            local_start_time = localtime(event.startTime).strftime("%Y-%m-%d %H:%M")
            send_mail(
            subject=f"One Of Your Events Was Updated",
            message=f"Hi {member.firstName},\n\nOne of your events -'{event.name}' - has been updated in {society_name}.\n\nDetails:\n{event.details}\nWhen: {local_start_time}\nWhere: {event.location}\n\nThanks,\nUniHub Management",
            from_email=None,
            recipient_list=[member.email],
            fail_silently=False,
        )
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# retrieving the data for one event
class GetSingleEventSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location', 'status', 'online']

    def getEventDetails(self, event):
        eventDetails = {"id":event.id, "name":event.name, "details":event.details, "startTime":event.startTime, "endTime":event.endTime, "location":event.location, "status":event.status, "online":event.online}
        return eventDetails

    def get_status(self, event):
        event.startTime = timezone.localtime(event.startTime)
        event.startTime = event.startTime - timedelta(hours=1)
        status = "none"
        if event.startTime <= timezone.now() <= event.endTime:
            status = "ongoing"
        elif event.endTime < timezone.now():
            status = "finished"
        elif event.startTime > timezone.now():
            status = "upcoming"
        return status 

# retrieving the society from an event
class GetSocietyFromEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Society
        fields = ['name']

@api_view(['GET'])
@permission_classes([AllowAny])
def getSocietyFromEvent(request, eventID):
    event = get_object_or_404(Event, id=eventID)
    event_check = Event.objects.filter(id=event.id)
    if not event_check.exists():
        return Response({"error": f"event {event.id} does not exist"})
    society = Society.objects.filter(id=event.society_id).first()
    serializer = GetSocietyFromEventSerializer(society)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def getSingleEvent(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)
    event = get_object_or_404(Event, id=eventID)
    event_check = Event.objects.filter(id=event.id, society=society)
    if not event_check.exists():
        return Response({"error": f"{society.name} does not have this event"})
    serializer = GetSingleEventSerializer(event)
    return Response(serializer.data)



class JoinEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRelation
        fields = ['event', 'account']

    def create(self, validated_data):
        event = validated_data['event']
        user = validated_data['account']

        print(f"Before join: numOfInterestedPeople = {event.numOfInterestedPeople}")

        # Create relation
        relation = EventRelation.objects.create(event=event, account=user)

        # Increment count safely
        event.numOfInterestedPeople += 1
        event.save(update_fields=['numOfInterestedPeople'])

        print(f"After join: numOfInterestedPeople = {event.numOfInterestedPeople}")

        return relation

class LeaveEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRelation
        fields = ['event', 'account']

    def leaveEvent(self, validated_data):
        event = validated_data['event']
        user = validated_data['account']

        print(f"Before leave: numOfInterestedPeople = {event.numOfInterestedPeople}")

        try:
            relation = EventRelation.objects.get(event=event, account=user)

            # Remove the member
            relation.delete()

            # Ensure count doesn't go below 0
            event.numOfInterestedPeople = max(event.numOfInterestedPeople - 1, 0)
            event.save(update_fields=['numOfInterestedPeople'])

            print(f"After leave: numOfInterestedPeople = {event.numOfInterestedPeople}")

            return {"message": f"{user.firstName} {user.lastName} opted out of the event", "numOfInterestedPeople": event.numOfInterestedPeople}
        except EventRelation.DoesNotExist:
            return {"error": "Event relation not found"}

def is_event_ongoing(event):
    event.startTime = timezone.localtime(event.startTime)
    event.startTime = event.startTime - timedelta(hours=1)
    status = "none"
    if event.startTime <= timezone.now() <= event.endTime:
        status = "ongoing"
    elif event.endTime < timezone.now():
        status = "finished"
    elif event.startTime > timezone.now():
        status = "upcoming"
    return status 


# Opt In To Event
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_event(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)

    event = get_object_or_404(Event, id=eventID)


    user = request.user
    data = {'event': event.id, 'account': user.id}
    full_name = f"{user.firstName} {user.lastName}"

    society_relation = SocietyRelation.objects.filter(society=society, account=user)
    if not society_relation.exists():
        return Response({"error": f"{full_name} is not signed up to this society"}, status=400)
    
    event_check = Event.objects.filter(id=event.id, society=society)
    if not event_check.exists():
        return Response({"error": f"{society.name} does not have this event"})

    event_relation = EventRelation.objects.filter(event=event, account=user)
    if event_relation.exists():
        return Response({"error": f"{full_name} is already registered to this event"}, status=400)
    
    status = is_event_ongoing(event)
    if status=="finished":
        return Response({"error": "You cannot join a finished event"}, status=400)

    serializer = JoinEventSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        if is_naive(event.startTime):
            event.startTime = make_aware(event.startTime)

        event.startTime = timezone.localtime(event.startTime)

        times = {
        "in 1 day": event.startTime - timedelta(days=1),
        "in 1 hour": event.startTime - timedelta(hours=1),
        "now": event.startTime + timedelta(hours=1),
        }

        print(f"event.startTime: {event.startTime}, timezone.now(): {timezone.now()}")
        for label, notify_time in times.items():
            print(f"Checking label '{label}' for time: {notify_time}")
            if label=="now":
                notify_time = notify_time - timedelta(hours=1)
            task = send_event_notification.apply_async(
                args=[user.id, event.id, label],
                eta = notify_time
            )
            ScheduledEventNotification.objects.create(
                user=user,
                event=event,
                notification_time=notify_time,
                task_name=task.id
            )

        updated_event = Event.objects.get(id=event.id)
        return Response({
            "message": f"{user.firstName} {user.lastName} opted in to the event",
            "numOfInterestedPeople": updated_event.numOfInterestedPeople
        }, status=200)
    
    
# Leave event
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_event(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)
    try:
        event = Event.objects.get(id=eventID)
    except Event.DoesNotExist:
        return Response({"error": "Event not found"}, status=404)
    
    event_check = Event.objects.filter(id=event.id, society=society)
    if not event_check.exists():
        return Response({"error": f"{society.name} does not have this event"})

    user = request.user
    data = {'event': event.id, 'account': user.id}
    full_name = f"{user.firstName} {user.lastName}"

    event_relation = EventRelation.objects.filter(event=event.id, account=user.id)
    if not event_relation:
        return Response({"error": f"{full_name} is not signed up to this event"}, status=400)

    serializer = LeaveEventSerializer(data=data)
    
    if serializer.is_valid():
        scheduled_tasks = ScheduledEventNotification.objects.filter(user=user, event=event)
        for task in scheduled_tasks:
            AsyncResult(task.task_name).revoke(terminate=True)
            task.delete()
        response_data = serializer.leaveEvent(serializer.validated_data)
        return Response(response_data, status=200)

    return Response(serializer.errors, status=400)

# Check if user is interested in event
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_interest(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)
    event = get_object_or_404(Event, id=eventID)
    
    event_check = Event.objects.filter(id=event.id, society=society)
    if not event_check.exists():
        return Response({"error": f"{society.name} does not have this event"})
    
    user = request.user
    event_relation = EventRelation.objects.filter(event=event, account=user)
    
    return Response({
        "is_registered": event_relation.exists()
    })
