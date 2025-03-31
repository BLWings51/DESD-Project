from rest_framework import generics
from .models import Society
from .permissions import *
from rest_framework import serializers
from rest_framework.permissions import *
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

# Functions with decorators

# Join society
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    user = request.user

    if user in society.members.all():
        return Response({"UserError": "User already a member"}, status=400)

    society.members.add(user)  # Add user to members list
    society.numOfInterestedPeople += 1  # Increase count
    society.save()

    return Response({"message": "User joined the society", "numOfInterestedPeople": society.numOfInterestedPeople}, status=200)

# Leave society
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    user = request.user

    if user not in society.members.all():
        return Response({"UserError": "User is not a member"}, status=400)

    society.members.remove(user)  # Remove user from members list
    society.numOfInterestedPeople = max(0, society.numOfInterestedPeople - 1)  # Decrease count, prevent negative numbers
    society.save()

    return Response({"message": "User left the society", "numOfInterestedPeople": society.numOfInterestedPeople}, status=200)

# Create society
@api_view(['POST'])
@permission_classes([IsAdmin])
def society_create(request):
    serializer = SocietySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Update society
@api_view(['POST'])
@permission_classes([IsAdmin])
def UpdateSocietyView(request, society_name):  
    try:
        society = Society.objects.get(name=society_name)  # Fetch the society by name
    except Society.DoesNotExist:
        return Response({"SocietyError": "Society not found"}, status=404)

    new_name = request.data.get("name")

    # Check if the new name is the same as the current one
    if new_name and new_name == society.name:
        return Response({"UpdateError": "Society is already up to date, no changes made"}, status=400)

    # Check if the new name is already in use by another society
    if new_name and Society.objects.filter(name=new_name).exclude(id=society.id).exists():
        return Response({"UpdateError": "Society with this name already exists"}, status=400)

    serializer = UpdateSocietySerializer(society, data=request.data, partial=True, context={'request': request})

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

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



# Serializers

class SocietySerializer(serializers.ModelSerializer):
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

class GetSocietySerializer(serializers.ModelSerializer):
    class Meta:
        model=Society
        fields = ['name', 'numOfInterestedPeople', 'description']

        def getSocietyDetails(self, society):
            societyDetails = {'name':society.name, 'numOfInterestedPeople':society.numOfInterestedPeople, 'description':society.description}
            return societyDetails

