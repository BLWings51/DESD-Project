from django.shortcuts import render
from rest_framework.generics import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework import serializers
from .models import Event, Society

# creating an event
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def CreateEvent(request, society_name):
    society = get_object_or_404(Society, name=society_name)
    serializer = CreateEventSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.data)

class CreateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Event
        fields = ['society', 'name', 'details', 'startTime', 'endTime', 'location']


    def create(self, validated_data):
        event = Event(society=self.context.get('society_name'), name=validated_data['name'], details=validated_data['details'], startTime=validated_data['startTime'], endTime=validated_data['endTime'], location=validated_data['location'])
        event.save()
        return event