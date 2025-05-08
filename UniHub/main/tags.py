from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import InterestTag
from django.db.models import Q

@api_view(['GET'])
@permission_classes([AllowAny])
def search_tags(request):
    query = request.GET.get('q', '')

    if not query:
        return Response([])

    # Get tags that contain the query (case insensitive), limit to 10
    tags = InterestTag.objects.filter(name__icontains=query).order_by('name')[:10]
    
    return Response([tag.name for tag in tags])
