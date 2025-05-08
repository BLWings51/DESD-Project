from celery import shared_task
from .models import Notification, Event, Account
import logging
logger = logging.getLogger(__name__)
from django.core.mail import send_mail
from .models import Event, Account
from django.utils.timezone import localtime

@shared_task
def send_event_notification(user_id, event_id, label):
    user = Account.objects.get(id=user_id)
    event = Event.objects.get(id=event_id)
    message = f"Reminder: The event '{event.name}' is starting {label}."

    # Save Notification in DB
    Notification.objects.create(recipient=user, message=message)

    # Send Email
    if user.email:
        local_start_time = localtime(event.startTime).strftime("%Y-%m-%d %H:%M")
        send_mail(
            subject=f"Reminder: {event.name} starts {label}",
            message=f"Hi {user.firstName},\n\nThis is a reminder that '{event.name}' will start {label}.\n\nDetails:\n{event.details}\nWhen: {local_start_time}\nWhere: {event.location}\n\nThanks,\nUniHub Management",
            from_email="deadbumbum@gmail.com",
            recipient_list=[user.email],
            fail_silently=False,
        )