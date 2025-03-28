from rest_framework import generics
from .models import Society
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    user = request.user

    if user in society.members.all():
        return Response({"message": "User already a member"}, status=400)

    society.members.add(user)  # Add user to members list
    society.numOfInterestedPeople += 1  # Increase count
    society.save()

    return Response({"message": "User joined the society", "numOfInterestedPeople": society.numOfInterestedPeople}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_society(request, society_name):
    try:
        society = Society.objects.get(name=society_name)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    user = request.user

    if user not in society.members.all():
        return Response({"message": "User is not a member"}, status=400)

    society.members.remove(user)  # Remove user from members list
    society.numOfInterestedPeople = max(0, society.numOfInterestedPeople - 1)  # Decrease count, prevent negative numbers
    society.save()

    return Response({"message": "User left the society", "numOfInterestedPeople": society.numOfInterestedPeople}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def society_create(request):
    serializer = SocietySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            raise serializers.ValidationError("Society with this name already exists.")
        return value

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def UpdateSocietyView(request, society_name):  
    try:
        society = Society.objects.get(name=society_name)  # Fetch the society by name
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

    serializer = UpdateSocietySerializer(society, data=request.data, partial=True, context={'request': request})

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


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
            raise serializers.ValidationError("Name is already in use")

        return value

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getSocietyDetails(request, society_name):
    society = Society.objects.get(name=society_name)
    serializer = GetSocietySerializer(society)
    return Response(serializer.data)

class GetSocietySerializer(serializers.ModelSerializer):
    class Meta:
        model=Society
        fields = ['name', 'numOfInterestedPeople', 'description']

        def getSocietyDetails(self, society):
            societyDetails = {'name':society.name, 'numOfInterestedPeople':society.numOfInterestedPeople, 'description':society.description}
            return societyDetails

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def DeleteSocietyView(request, society_name):  
    try:
        society = Society.objects.get(name=society_name)  # Find society by name
        society.delete()  # Delete the society
        return Response({"success": "Society deleted successfully"}, status=200)
    except Society.DoesNotExist:
        return Response({"error": "Society does not exist"}, status=404)