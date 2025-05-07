# notifications/serializers.py
from rest_framework import serializers
from .models import Notification
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from rest_framework.generics import get_object_or_404

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    user = request.user
    notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['message', 'created_at', 'is_read']

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
    




# things needed to be displayed on notifications:
# Event announcements from societies they are a part of
# 1 day, 1 hour, and 'starting now' announcements for events they opted into
# Campus wide events set by admins and site announcements
        