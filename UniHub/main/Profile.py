from rest_framework.generics import get_object_or_404

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Account, SocietyRelation, Society, Event, EventRelation
from rest_framework import serializers

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        
        model=Account
        fields = ['bio', 'firstName', 'lastName', 'email', 'pfp', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validateEmail(self, value):
        user = self.context['request'].user
        
        if Account.objects.exclude(pk=user.account.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use")
        return value
    
    def update(self, instance, validated_data):
        instance.bio = validated_data.get('bio', instance.bio)
        instance.firstName = validated_data.get('firstName', instance.firstName)
        instance.lastName = validated_data.get('lastName', instance.lastName)
        instance.email = validated_data.get('email', instance.email)
        instance.pfp = validated_data.get('pfp', instance.pfp)
        password = validated_data.get('password', None)
        
        if password:
            instance.set_password(password)
        instance.save()
        return instance


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def UpdateProfileView(request):
    account = request.user
    serializer = UpdateProfileSerializer(account, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

# Displaying the societies the person is apart of
# Serializer
class GetSocietySerializer(serializers.ModelSerializer):
     class Meta:
        model = Society
        fields = ['name']
        
class SocietyRelationSerializer(serializers.ModelSerializer):
    society = GetSocietySerializer(read_only=True)

    class Meta:
        model = SocietyRelation
        fields = ['society']

# Displaying the Events the person is apart of
# Serializers
class GetEventSerializer(serializers.ModelSerializer):
     class Meta:
        model = Event
        fields = ['name']
        
class EventRelationSerializer(serializers.ModelSerializer):
    society = GetSocietySerializer(read_only=True)

    class Meta:
        model = EventRelation
        fields = ['event']        
        

# Displaying profile details
# Serializer
class GetAccountSerializer(serializers.ModelSerializer):
    is_owner = serializers.SerializerMethodField()
    societies = serializers.SerializerMethodField()
    events = serializers.SerializerMethodField()
    
    class Meta:
        model=Account
        fields = ['bio', "accountID", 'firstName', 'lastName', 'email', 'pfp', 'is_owner', "societies", "events"]

    def getAccountDetails(self, account):
        accountDetails = {'bio':account.bio, 'accountID':account.accountID, 'firstName':account.firstName, 'lastName':account.lastName, 'email':account.email, 'pfp':account.pfp, 'is_owner':account.is_owner}
        return accountDetails
    
    def get_is_owner(self, account):
        request = self.context.get('request')
        is_owner = False
        if request.user.is_authenticated:
            if account.accountID == request.user.accountID:
                is_owner = True
        return is_owner
        
    def get_societies(self, account):
        return [relation.society.name for relation in account.societyrelation_set.all()]
    
    def get_events(self, account):
        return [relation.event.name for relation in account.eventrelation_set.all()]

# Views
@api_view(['GET'])
@permission_classes([AllowAny])
def getAccountDetails(request, account_ID):
    account = get_object_or_404(Account, accountID=account_ID)
    serializer = GetAccountSerializer(account, context={'request': request})
    return Response(serializer.data)
