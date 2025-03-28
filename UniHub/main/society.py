from rest_framework import generics
from .models import Society
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .permissions import CustomIsAdminUser

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
    
# List all societies or create a new one
class SocietyListCreateView(generics.ListCreateAPIView):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    #permission_classes = [IsAuthenticated]  # Requires authentication

# Retrieve a specific society
class SocietyDetailView(generics.RetrieveAPIView):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    #permission_classes = [IsAuthenticated]  # Requires authentication