from django.shortcuts import render
from rest_framework.generics import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework.fields import DateTimeField 

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework import serializers
from .models import Event, Society, SocietyRelation
from .permissions import IsAdminOrSocietyAdmin

# creating an event
class CreateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ['name', 'details', 'startTime', 'endTime', 'location']


    def create(self, validated_data):
        society = self.context.get('society')
        event = Event(society=society, name=validated_data['name'], details=validated_data['details'], startTime=validated_data['startTime'], endTime=validated_data['endTime'], location=validated_data['location'])
        event.save()
        return event
    
@api_view(['POST'])
@permission_classes([IsAdminOrSocietyAdmin])
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
    

# retreiving data for every event within a society
class GetAllEventSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location', 'status']

    def getEventDetails(self, event):
        eventDetails = {"id":event.id, "name":event.name, "details":event.details, "startTime":event.startTime, "endTime":event.endTime, "location":event.location, "status":event.status}
        return eventDetails

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
@api_view(['DELETE'])
@permission_classes([IsAdminOrSocietyAdmin])
def deleteEvent(request, society_name, eventID):
    try:
        event = get_object_or_404(Event, id=eventID)
        event.delete()
        return Response({"success":"true"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    

#update events
class UpdateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ['name', 'details', 'startTime', 'endTime', 'location']
    
    def update(self, instance, validated_data):        
        instance.name = validated_data.get('name', instance.name)
        instance.details = validated_data.get('details', instance.details)
        instance.startTime = validated_data.get('startTime', instance.startTime)
        instance.endTime = validated_data.get('endTime', instance.endTime)
        instance.location = validated_data.get('location', instance.location)
        instance.save()
        return instance


@api_view(['POST'])
@permission_classes([IsAdminOrSocietyAdmin])
def UpdateEvent(request, society_name, eventID):
    event = get_object_or_404(Event, id=eventID)
    datetime_parser = DateTimeField()
    
    startTime = request.data.get("startTime", event.startTime)
    endTime = request.data.get("endTime", event.endTime)

    try:
        if isinstance(startTime, str):
            startTime = datetime_parser.to_internal_value(startTime)
        if isinstance(endTime, str):
            endTime = datetime_parser.to_internal_value(endTime)
    except Exception:
        return Response({"error": "Invalid date format"}, status=400)

    if endTime and startTime and endTime <= startTime:
        return Response({"error": "End date cannot be equal to or before the start date"}, status=400)
    serializer = UpdateEventSerializer(event, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# retrieving the data for one event
class GetSingleEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ['id', 'name', 'details', 'startTime', 'endTime', 'location']
    

@api_view(['GET'])
@permission_classes([AllowAny])
def getSingleEvent(request, society_name, eventID):
    society = get_object_or_404(Society, name=society_name)
    event = get_object_or_404(Event, id=eventID)
    serializer = GetSingleEventSerializer(event)
    return Response(serializer.data)