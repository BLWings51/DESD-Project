from rest_framework.generics import get_object_or_404
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Account, SocietyRelation, Society, Event, EventRelation, InterestTag, FriendRelation
from rest_framework import serializers
from .signup import InterestTagSerializer

class UpdateProfileSerializer(serializers.ModelSerializer):
    interests = InterestTagSerializer(many=True, required=False)

    class Meta:
        model = Account
        fields = [
            'bio', 'firstName', 'lastName', 'email', 'pfp', 'password',
            'address', 'dob', 'course', 'year_of_course', 'interests'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        user = self.context['request'].user
        target_account = self.instance
        
        # Admin users can change any user's email
        if getattr(user, 'adminStatus', False):
            return value
        
        # Regular users can only change their own email
        if Account.objects.exclude(pk=target_account.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use")
        return value
    
    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)
        # Handle fields
        for field in ['bio', 'firstName', 'lastName', 'email', 'pfp', 'address', 'dob', 'course', 'year_of_course']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        # Handle password
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)

        # Handle interests (tags)
        if interests_data is not None:
            tags = []
            for interest_data in interests_data:
                tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
                tags.append(tag)
            instance.interests.set(tags)

        instance.save()
        return instance

class UpdateProfilePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['pfp']

    def update(self, instance, validated_data):
        if 'pfp' in validated_data:
            # Delete old file if it exists and is not the default
            if instance.pfp and instance.pfp.name != 'default.webp':
                instance.pfp.delete(save=False)
            instance.pfp = validated_data['pfp']
            instance.save()
        return instance

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def UpdateProfileView(request):
    # Get the target account (either the user's own account or another account for admins)
    target_account_id = request.data.get('accountID')
    if target_account_id and getattr(request.user, 'adminStatus', False):
        account = get_object_or_404(Account, accountID=target_account_id)
    else:
        account = request.user
    
    serializer = UpdateProfileSerializer(account, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()

        # Logout if password was changed and it's the user's own account
        if 'password' in request.data and account == request.user:
            res = Response({'message': 'Password updated. Please login again.'})
            res.delete_cookie('access_token', path="/", samesite='None')
            res.delete_cookie('refresh_token', path="/", samesite='None')
            return res
        
        updated_account = Account.objects.get(pk=account.pk)
        response_serializer = GetAccountSerializer(updated_account, context={'request': request})
        
        return Response(response_serializer.data)
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
    society = GetSocietySerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = ['name', 'society']
        
class EventRelationSerializer(serializers.ModelSerializer):
    society = GetSocietySerializer(read_only=True)

    class Meta:
        model = EventRelation
        fields = ['event']        
        

# Displaying profile details
# Serializer
class GetAccountSerializer(serializers.ModelSerializer):
    interests = InterestTagSerializer(many=True)
    is_owner = serializers.SerializerMethodField()
    societies = serializers.SerializerMethodField()
    events = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_friend = serializers.SerializerMethodField()
    
    class Meta:
        model=Account
        fields = [
            'bio', "accountID", 'firstName', 'lastName', 'email', 'pfp', "societies", "events",
            'is_owner', 'is_admin', 'is_friend', 'address', 'dob', 'course', 'year_of_course', 'interests'
        ]
        
    def get_is_admin(self, account):
        request = self.context.get('request')
        return request.user.is_authenticated and getattr(request.user, 'adminStatus', False)
        
    def get_is_owner(self, account):
        request = self.context.get('request')
        is_owner = False
        if request.user.is_authenticated:
            if account.accountID == request.user.accountID:
                is_owner = True
        return is_owner
        
    def get_is_friend(self, account):
        request = self.context.get('request')
        if not request.user.is_authenticated:
            return False
        return FriendRelation.are_friends(account, request.user)

    def get_societies(self, account):
        request = self.context.get('request')
        is_owner = self.get_is_owner(account)
        is_admin = self.get_is_admin(account)
        is_friend = self.get_is_friend(account)

        if is_owner or is_admin or is_friend:
            return [relation.society.name for relation in account.societyrelation_set.all()]
        return []

    def get_events(self, account):
        request = self.context.get('request')
        is_owner = self.get_is_owner(account)
        is_admin = self.get_is_admin(account)
        is_friend = self.get_is_friend(account)

        if is_owner or is_admin or is_friend:
            events = [relation.event for relation in account.eventrelation_set.all()]
            return GetEventSerializer(events, many=True, context=self.context).data
        return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_owner = self.get_is_owner(instance)
        is_admin = self.get_is_admin(instance)
        if not (is_owner or is_admin):
            data.pop('dob', None)
            data.pop('address', None)
        return data

# Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getAccountDetails(request, account_ID):
    account = get_object_or_404(Account, accountID=account_ID)
    serializer = GetAccountSerializer(account, context={'request': request})
    return Response(serializer.data)


# Deleting account
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteProfile(request, account_ID=None):
    # If account_ID is provided and user is admin, delete that account
    # Otherwise, delete the user's own account
    if account_ID and getattr(request.user, 'adminStatus', False):
        account = get_object_or_404(Account, accountID=account_ID)
    else:
        account = request.user
    
    account.delete()
    return Response({"message": "Account deleted successfully."}, status=204)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request, account_ID):
    try:
        account = Account.objects.get(accountID=account_ID)
        # Allow admin users to update any profile picture
        if account != request.user and not getattr(request.user, 'adminStatus', False):
            return Response({"error": "You can only update your own profile picture"}, status=status.HTTP_403_FORBIDDEN)
            
        if 'pfp' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UpdateProfilePictureSerializer(account, data=request.FILES, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Account.DoesNotExist:
        return Response({"error": "Account not found"}, status=status.HTTP_404_NOT_FOUND)