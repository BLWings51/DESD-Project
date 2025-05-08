from rest_framework import serializers
from .models import Notification, Event, Society, SocietyRelation, LiveEventChat, EventRelation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSocietyAdmin
from rest_framework.response import Response
from .models import Notification
from rest_framework.generics import get_object_or_404
from django.utils import timezone
from datetime import timedelta


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

class talkInChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveEventChat
        fields = ['sender', 'event', 'text']

    def create(self, validated_data):
        sender = validated_data.get('sender')
        event = validated_data.get('event')
        text = validated_data.get('text')
        chat = LiveEventChat(sender=sender, event=event, text=text)
        chat.save()
        return chat
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def talkInChat(request, eventID):
    user = request.user
    event = get_object_or_404(Event, id=eventID)
    eventRelation = EventRelation.objects.filter(event=event, account=user).first()
    if not eventRelation:
        return Response({"error": "You need to join this event in order to participate in the chat"}, status=400)
    
    status = is_event_ongoing(event)
    if status == "upcoming":
        return Response({"error": "You cannot talk in this chat until the event starts"}, status=400)

    finalMessage = LiveEventChat.objects.filter(event=event, finalMessage=True).first()
    if finalMessage:
        return Response({"error": "This chat has ended. You may no longer talk in it"}, status=400)
        
    if not event.online:
        return Response({"error": "There is/was no live chat for this event"}, status=400)
    
    data = request.data.copy()
    data['sender'] = user.id
    data['event'] = event.id
    
    serializer = talkInChatSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

class GetAllChatsSerializer(serializers.ModelSerializer):
    is_owner = serializers.SerializerMethodField()
    firstName = serializers.SerializerMethodField()
    lastName = serializers.SerializerMethodField()
    pfp = serializers.SerializerMethodField()
    
    class Meta:
        model=LiveEventChat
        fields = ['id', 'sender', 'event', 'text', 'finalMessage', 'is_owner', 'firstName', 'lastName', 'pfp']

    def getChatDetails(self, chat):
        chatDetails = {"id":chat.id, "sender":chat.sender, "event":chat.event, "text":chat.text, "finalMessage":chat.finalMessage, "is_owner":chat.is_owner, "firstName":chat.firstName, "lastName":chat.lastName, "pfp":chat.pfp}
        return chatDetails

    def get_is_owner(self, chat):
        user = self.context.get('user')
        is_owner = False
        if user.is_authenticated:
            if chat.sender == user:
                is_owner = True
        return is_owner 
    
    def get_firstName(self, chat):
        user = self.context.get('user')
        firstName = user.firstName
        return firstName
    
    def get_lastName(self, chat):
        user = self.context.get('user')
        lastName = user.lastName
        return lastName
    
    def get_pfp(self, chat):
        user = self.context.get('user')
        pfp = user.pfp
        return pfp.url
        

        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAllMessages(request, eventID):
    event = get_object_or_404(Event, id=eventID)
    user = request.user
    eventRelation = EventRelation.objects.filter(event=event, account=user).first()
    if not eventRelation:
        return Response({"error": "You need to join this event in order to participate in the chat"}, status=400)
    
    status = is_event_ongoing(event)
    if status == "upcoming":
        return Response({"error": "You cannot view this chat until the event starts"}, status=400)
    
    if not event.online:
        return Response({"error": "There is/was no live chat for this event"}, status=400)
    

    messages = LiveEventChat.objects.filter(event=event, finalMessage=False)
    serializer = GetAllChatsSerializer(messages, many=True, context={"user":request.user})
    return Response(serializer.data)

class SendFinalMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveEventChat
        fields = ['sender', 'event', 'text', 'finalMessage']

    def create(self, validated_data):
        sender = validated_data.get('sender')
        event = validated_data.get('event')
        text = validated_data.get('text')
        finalMessage = True
        chat = LiveEventChat(sender=sender, event=event, text=text, finalMessage=finalMessage)
        chat.save()
        return chat

@api_view(['POST'])
@permission_classes([IsSocietyAdmin])
def sendFinalMessage(request, society_name, eventID):
    user = request.user
    society = get_object_or_404(Society, name=society_name)
    societyEventRelation = Event.objects.filter(id=eventID, society=society).first()
    if not societyEventRelation:
        return Response({"error": "This event is not part of this society"}, status=400)
    event = get_object_or_404(Event, id=eventID)
    eventRelation = EventRelation.objects.filter(event=event, account=user).first()
    if not eventRelation:
        return Response({"error": "You need to join this event in order to end it"}, status=400)
    
    status = is_event_ongoing(event)
    if status == "upcoming":
        return Response({"error": "You cannot end this chat until the event starts"}, status=400)
    finalMessage = LiveEventChat.objects.filter(event=event, finalMessage=True).first()
    if finalMessage:
        return Response({"error": "This chat has already ended"}, status=400)
        
    if not event.online:
        return Response({"error": "There is/was no live chat for this event"}, status=400)
    
    data = request.data.copy()
    data['sender'] = user.id
    data['event'] = event.id
    data['text'] = "The chat has ended"
    
    serializer = SendFinalMessageSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

# deleting a selected message
@api_view(['DELETE'])
@permission_classes([IsSocietyAdmin])
def deleteChat(request, society_name, eventID, chatID):
    try:
        user = request.user
        event = get_object_or_404(Event, id=eventID)
        society = get_object_or_404(Society, name=society_name)
        chat = get_object_or_404(LiveEventChat, id=chatID)
        event_check = Event.objects.filter(id=event.id, society=society)
        if not event_check.exists():
            return Response({"error": f"{society.name} does not have this event"}, status=400)
        
        chat_check = LiveEventChat.objects.filter(id=chatID, event=event)
        if not chat_check.exists():
            return Response({"error": "The selected chat does not belong to this event"}, status=400)
        
        eventRelation = EventRelation.objects.filter(event=event, account=user).first()
        if not eventRelation:
            return Response({"error": "You need to join this event in order to delete chats"}, status=400)
        
        status = is_event_ongoing(event)
        if status == "upcoming":
            return Response({"error": "You cannot delete a chat until the event starts"}, status=400)
        
        if chat.finalMessage == True:
            return Response({"error": "You cannot delete the ending of the chat"}, status=400)
    
        chat.delete()
        return Response({"success":"true"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hasChatEnded(request, eventID):
    event = get_object_or_404(Event, id=eventID)
    finalMessage = LiveEventChat.objects.filter(event=event, finalMessage=True)
    if finalMessage.exists():
        return Response({"success": True})
    else:
        return Response({"success": False})