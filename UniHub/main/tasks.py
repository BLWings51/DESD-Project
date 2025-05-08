from celery import shared_task
from .models import Notification, Event, Account
import logging
logger = logging.getLogger(__name__)

@shared_task
def send_event_notification(user_id, event_id, label):
    try:
        user = Account.objects.get(id=user_id)
        event = Event.objects.get(id=event_id)
        Notification.objects.create(
            recipient=user,
            message=f"The event '{event.name}' starts {label}!"
        )
        logger.info(f"Notification created for user {user.id} for event {event.id} at {label}")
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")