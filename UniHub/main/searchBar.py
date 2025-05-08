from django.http import JsonResponse
from django.db.models import Q
from main.models import Society, Event, Account, Post
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# Search function to handle search queries for societies, events, users, and posts
@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '')  # Get the search query from the request
    search_type = request.GET.get('type', '') 

    results = {}

    # Check if the query is empty
    if not query:
        return JsonResponse({'error': 'No search query provided'}, status=400)

    # Search Societies
    if search_type in ['', 'society']:
        societies = Society.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        results['societies'] = list(societies.values('id', 'name', 'description', 'numOfInterestedPeople'))

    # Search Events
    if search_type in ['', 'event']:
        events = Event.objects.filter(Q(name__icontains=query) | Q(details__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        results['events'] = list(events.values('id', 'name', 'details', 'startTime', 'endTime', 'location', 'society_id'))

    # Search Users
    if search_type in ['', 'user']:
        users = Account.objects.filter(
            Q(firstName__icontains=query) | Q(lastName__icontains=query) | Q(email__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        results['users'] = list(users.values('accountID', 'firstName', 'lastName', 'email'))

    # Search Posts
    if search_type in ['', 'post']:
        posts = Post.objects.filter(Q(content__icontains=query) | Q(interests__name__icontains=query)).distinct()
        results['posts'] = list(posts.values('id', 'content', 'created_at', 'author_id', 'society_id'))

    return JsonResponse(results)