from rest_framework import generics
from .models import Society
from .serializer import SocietySerializer
from rest_framework.permissions import IsAuthenticated

# List all societies or create a new one
class SocietyListCreateView(generics.ListCreateAPIView):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [IsAuthenticated]  # Requires authentication

# Retrieve a specific society
class SocietyDetailView(generics.RetrieveAPIView):
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [IsAuthenticated]  # Requires authentication
