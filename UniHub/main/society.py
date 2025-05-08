from rest_framework import generics
from .models import Society, SocietyRelation, Account
from .permissions import *
from rest_framework import serializers
from rest_framework.permissions import *
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, APIView


# Functions with decorators

# Join society
import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    logger.info(f"Authenticated request.user: {request.user}, ID: {request.user.id}, Account ID: {request.user.accountID}, Email: {request.user.email}")

    # Check if the relation already exists using SocietyRelation
    if SocietyRelation.objects.filter(society=society, account=request.user).exists():
        return Response({"UserError": f"{request.user.firstName} {request.user.lastName} is already a member"}, status=400)

    # Create the relation in SocietyRelation
    SocietyRelation.objects.create(society=society, account=request.user, adminStatus=False)
    logger.info(f"User {request.user.firstName} {request.user.lastName} joined {society.name} via SocietyRelation")

    society.numOfInterestedPeople += 1
    society.save()
    return Response({
        "message": f"{request.user.firstName} {request.user.lastName} joined the society",
        "numOfInterestedPeople": society.numOfInterestedPeople
    }, status=200)

# Leave society
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    user = request.user

    # Check for membership using SocietyRelation
    try:
        SocietyRelation.objects.get(society=society, account=user)
        # Relation exists, so delete it
        SocietyRelation.objects.filter(society=society, account=user).delete()
        society.numOfInterestedPeople = max(society.numOfInterestedPeople - 1, 0)
        society.save()
        return Response({"message": f"{user.firstName} {user.lastName} left the society", "numOfInterestedPeople": society.numOfInterestedPeople})
    except SocietyRelation.DoesNotExist:
        return Response({"UserError": f"{user.firstName} {user.lastName} is not a member of this society"}, status=400)

# Create society
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def society_create(request):
    serializer = CreateSocietySerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        serializer.save()
        society = Society.objects.filter(name=request.data.get('name')).first()
        societyrelation = SocietyRelation.objects.create(society=society, account=user, adminStatus=True)
        societyrelation.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update society
@api_view(['POST'])
@permission_classes([IsAdminOrSocietyAdmin])
def UpdateSocietyView(request, society_name):  
    try:
        society = Society.objects.get(name=society_name)  # Fetch the society by name
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    new_name = request.data.get("name")

    # Check if the new name is already in use by another society
    if new_name and Society.objects.filter(name=new_name).exclude(id=society.id).exists():
        return Response({"UpdateError": "Society with this name already exists"}, status=400)

    serializer = UpdateSocietySerializer(society, data=request.data, partial=True, context={'request': request})

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

# Delete society
@api_view(['DELETE'])
@permission_classes([IsAdmin])
def DeleteSocietyView(request, society_name):  
    try:
        society = Society.objects.get(name=society_name)  # Find society by name
        society.delete()  # Delete the society
        return Response({"success": "Society deleted successfully"}, status=200)
    except Society.DoesNotExist:
        return Response({"error": "Society does not exist or already deleted"}, status=404)


# Promote members to Society Admin
@api_view(['POST'])
@permission_classes([IsAdmin])  # Restrict to admins only
def promote_member(request, society_name, member_id):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    user = request.user
    full_name = f"{user.firstName} {user.lastName}"

    try:
        member_relation = SocietyRelation.objects.get(society=society, account_id=member_id)
    except SocietyRelation.DoesNotExist:
        return Response({"error": f"{full_name} is not a member of this society"}, status=400)

    if member_relation.adminStatus:
        return Response({"error": f"{full_name} is already promoted as admin"}, status=400)

    # Use serializer to promote the user
    serializer = PromoteMemberSerializer(member_relation, data={"adminStatus": True}, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": f"{full_name} has been promoted to admin"}, status=200)

    return Response(serializer.errors, status=400)


# Demote members
@api_view(['POST'])
@permission_classes([IsAdmin])
def demote_member(request, society_name, member_id):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    user = request.user
    full_name = f"{user.firstName} {user.lastName}"

    try:
        member_relation = SocietyRelation.objects.get(society=society, account_id=member_id)
    except SocietyRelation.DoesNotExist:
        return Response({"error": f"{full_name} is not a member of this society"}, status=400)

    if not member_relation.adminStatus:
        return Response({"error": f"{full_name} is already demoted as member"}, status=400)

    # Use serializer to promote the user
    serializer = DemoteMemberSerializer(member_relation, data={"adminStatus": False}, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response({"message": f"{full_name} has been demoted to member"}, status=200)

    return Response(serializer.errors, status=400)

# Kick members
@api_view(['POST'])
@permission_classes([IsAdmin])
def kick_member(request, society_name, member_id):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    try:
        member_to_kick = Account.objects.get(id=member_id)
    except Account.DoesNotExist:
        return Response({"error": f"Member with ID {member_id} not found"}, status=400)

    if member_to_kick not in society.members.all():
        return Response({"error": f"{member_to_kick.firstName} {member_to_kick.lastName} is not a member of this society"}, status=400)

    # You might want to check admin status here if needed, before removing
    if member_to_kick.adminStatus:  # Assuming adminStatus is on the Account model
        return Response({"error": f"Cannot kick {member_to_kick.firstName} {member_to_kick.lastName} as an admin"}, status=400)

    society.members.remove(member_to_kick)
    society.numOfInterestedPeople = max(society.numOfInterestedPeople - 1, 0)
    society.save()
    return Response({"message": f"{member_to_kick.firstName} {member_to_kick.lastName} has been kicked from society", "numOfInterestedPeople": society.numOfInterestedPeople}, status=200)

# Return a list of societies
@api_view(['GET'])
@permission_classes([AllowAny])
def getAllSocieties(request):
    societies = Society.objects.all()  # Get all societies
    serializer = GetSocietySerializer(societies, many=True)  # Serialize multiple objects
    return Response(serializer.data, status=200)

# Get society Details
@api_view(['GET'])
@permission_classes([AllowAny])
def getSocietyDetails(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
        serializer = GetSocietySerializer(society)
        return Response(serializer.data, status=200)
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

# Get members
@api_view(['GET'])
@permission_classes([AllowAny])
def getmembers(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    serializer = GetSocietySerializer(society)  # Use the GetSocietySerializer
    return Response(serializer.data)


# Serializers

class KickMemberSerializer(serializers.Serializer):  # Use serializers.Serializer, not ModelSerializer
    society = serializers.PrimaryKeyRelatedField(queryset=Society.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all())

    def kickMember(self, validated_data):
        society = validated_data['society']
        account = validated_data['account']

        print(f"Before kick: numOfInterestedPeople = {society.numOfInterestedPeople}")

        try:
            relation = SocietyRelation.objects.get(society=society, account=account)

            # Remove the member
            relation.delete()

            # Ensure count doesn't go below 0
            society.numOfInterestedPeople = max(society.numOfInterestedPeople - 1, 0)
            society.save(update_fields=['numOfInterestedPeople'])

            print(f"After kick: numOfInterestedPeople = {society.numOfInterestedPeople}")

            return {"message": f"{account.firstName} {account.lastName} has been kicked from society", "numOfInterestedPeople": society.numOfInterestedPeople}
        except SocietyRelation.DoesNotExist:
            return {"SocietyError": "Society relation not found"}

        
        

class PromoteMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyRelation
        fields = ['adminStatus']  # Only updating adminStatus

    def update(self, instance, validated_data):
        instance.adminStatus = True  # Demote the user
        instance.save()
        return instance


class DemoteMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocietyRelation
        fields = ['adminStatus']  # Only updating adminStatus

    def update(self, instance, validated_data):
        instance.adminStatus = False  # Demote the user
        instance.save()
        return instance


class JoinSocietySerializer(serializers.ModelSerializer):
    society_id = serializers.PrimaryKeyRelatedField(queryset=Society.objects.all(), source="society")
    account_id = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), source="account")
    class Meta:
        model = SocietyRelation
        fields = ['society_id', 'account_id', 'adminStatus']

    def create(self, validated_data):
        society = validated_data['society']
        user = validated_data['account']

        print(f"Before join: numOfInterestedPeople = {society.numOfInterestedPeople}")

        # Create relation
        relation = SocietyRelation.objects.create(society=society, account=user, adminStatus=False)

        # Increment count safely
        society.numOfInterestedPeople += 1
        society.save(update_fields=['numOfInterestedPeople'])

        print(f"After join: numOfInterestedPeople = {society.numOfInterestedPeople}")

        return relation

class LeaveSocietySerializer(serializers.ModelSerializer):
    society_id = serializers.PrimaryKeyRelatedField(queryset=Society.objects.all(), source="society")
    account_id = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), source="account")
    class Meta:
        model = SocietyRelation
        fields = ['society_id', 'account_id', 'adminStatus']

    def leaveSociety(self, validated_data):
        society = validated_data['society']
        user = validated_data['account']

        print(f"Before leave: numOfInterestedPeople = {society.numOfInterestedPeople}")

        try:
            relation = SocietyRelation.objects.get(society=society, account=user)

            # Remove the member
            relation.delete()

            # Ensure count doesn't go below 0
            society.numOfInterestedPeople = max(society.numOfInterestedPeople - 1, 0)
            society.save(update_fields=['numOfInterestedPeople'])

            print(f"After leave: numOfInterestedPeople = {society.numOfInterestedPeople}")

            return {"message": f"{user.firstName} {user.lastName} left the society", "numOfInterestedPeople": society.numOfInterestedPeople}
        except SocietyRelation.DoesNotExist:
            return {"SocietyError": "Society relation not found"}


class CreateSocietySerializer(serializers.ModelSerializer):
    class Meta:
        model = Society
        fields = ['name', 'numOfInterestedPeople', 'description']

    def create(self, validated_data):
        society = Society.objects.create(**validated_data)
        society.save()
        return society
    
    def validate_name(self, value):
        if Society.objects.filter(name=value).exists():
            raise serializers.ValidationError({"CreateError": "Society with this name exists"})
        return value

class UpdateSocietySerializer(serializers.ModelSerializer):
    class Meta:
        model = Society
        fields = ['name', 'description']

    def validate_name(self, value):
        """
        Ensure the society name is unique (excluding the current society).
        """
        society_id = self.instance.id  # Get the ID of the society being updated

        if Society.objects.exclude(id=society_id).filter(name=value).exists():
            raise serializers.ValidationError({"UpdateError": "Name is already in use"})

        return value

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'accountID', 'email']


class GetSocietySerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Society
        fields = ['name', 'numOfInterestedPeople', 'description', 'members']

    def get_members(self, society):
        society_relations = SocietyRelation.objects.filter(society=society)
        return SocietyMemberViaRelationSerializer(society_relations, many=True).data

class SocietyMemberViaRelationSerializer(serializers.ModelSerializer):
    account = serializers.SerializerMethodField()

    class Meta:
        model = SocietyRelation
        fields = ['account', 'adminStatus']

    def get_account(self, society_relation):
        return AccountSerializer(society_relation.account).data