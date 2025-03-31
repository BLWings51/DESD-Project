from django.shortcuts import render
from rest_framework.generics import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework import serializers
from .models import Event, Society, SocietyRelation

# creating an event
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def CreateEvent(request, society_name):
    society = get_object_or_404(Society, name=society_name)
    serializer = CreateEventSerializer(data=request.data, context={'society': society})
    startTime = request.data.get('startTime')
    endTime = request.data.get('endTime')
    if endTime <= startTime:
        return Response({"error": "End date cannot be equal to or before the start date"}, status=400)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.data)

class CreateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ['name', 'details', 'startTime', 'endTime', 'location']


    def create(self, validated_data):
        society = self.context.get('society')
        event = Event(society=society, name=validated_data['name'], details=validated_data['details'], startTime=validated_data['startTime'], endTime=validated_data['endTime'], location=validated_data['location'])
        event.save()
        return event
    

# retreiving data for every event within a society
class GetAllEventSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location', 'status']

    def getEventDetails(self, event):
        accountDetails = {"id":event.id, "name":event.name, "details":event.details, "startTime":event.startTime, "endTime":event.endTime, "location":event.location, "status":event.status}
        return accountDetails

    def get_status(self, event):
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
class DeleteEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['__all__']

    def delete(self, validated_data):
        try:
            event = Event.objects.filter(id=validated_data['id'])
            event.delete()
            return Response({"success":True}, status=200)
        except:
            return Response({"error": "Event does not exist"}, status=400)
        