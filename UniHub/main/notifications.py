# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, Event, Society, SocietyRelation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from rest_framework.generics import get_object_or_404
import datetime

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'created_at', 'is_read']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    user = request.user
    notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notification_quantity(request):
    user = request.user
    quantity = 0
    notification_list = Notification.objects.filter(recipient=user).values_list('is_read', flat=True)
    for notification in notification_list:
        if notification==False:
            quantity += 1
    return Response({'quantity':quantity})

class UpdateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'is_read']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, notificationID):
    notification = get_object_or_404(Notification, id=notificationID)

    # Check that the logged-in user is the owner of the notification
    if notification.recipient != request.user:
        return Response({"error": "You do not have permission to mark this notification."}, status=403)

    serializer = UpdateNotificationSerializer(notification, data={'is_read': True}, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

class NotificationStartTimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['message', 'created_at', 'is_read']

    def create(self, validated_data):
        user = validated_data.user
        timing = self.context.get('timing')
        event = self.context.get('event')
        society = self.context.get('society')
        notification = Notification(recipient=user, message=f"{event.name} for {society.name} starts {timing}")
        notification.save()
        return notification

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timed_notifications(request):
    user = request.user
    society_ids = SocietyRelation.objects.filter(account=user).values_list('society_id', flat=True)
    events = Event.objects.filter(society_id__in=society_ids)
    for event in events:
        if datetime.datetime.now() == event.startTime:
            serializer = NotificationStartTimeSerializer(request.data, context={'timing':"now", 'event': event, 'society':event.society.name})
    return Response({"success":"finished"})
    
        