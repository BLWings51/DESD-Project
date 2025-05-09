from django.http import JsonResponse
from django.db.models import Q
from main.models import Society, Event, Account, Post, FriendRelation, SocietyRelation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# Search function to handle search queries for societies, events, users, and posts
@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '')  # Get the search query from the request
    search_type = request.GET.get('type', '') 
    sort = request.GET.get('sort')
    order = request.GET.get('order', 'desc')
    friends_only = request.GET.get('friends_only') == 'true'

    results = {}

    # Check if the query is empty
    if not query:
        return JsonResponse({'error': 'No search query provided'}, status=400)

    # Search Societies
    if search_type in ['', 'society']:
        societies = Society.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        if friends_only and request.user.is_authenticated:
            friends = [fr.to_account for fr in FriendRelation.objects.filter(from_account=request.user, confirmed=True)]
            friends += [fr.from_account for fr in FriendRelation.objects.filter(to_account=request.user, confirmed=True)]
            friend_society_ids = SocietyRelation.objects.filter(account__in=friends).values_list('society_id', flat=True)
            societies = societies.filter(id__in=friend_society_ids).distinct()
        if sort == 'popularity':
            societies = societies.order_by('-numOfInterestedPeople' if order == 'desc' else 'numOfInterestedPeople')
        results['societies'] = list(societies.values('id', 'name', 'description', 'numOfInterestedPeople'))

    # Search Events
    if search_type in ['', 'event']:
        events = Event.objects.filter(
            Q(name__icontains=query) | Q(details__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        if friends_only and request.user.is_authenticated:
            # Get all friends' accounts
            friends = [fr.to_account for fr in FriendRelation.objects.filter(from_account=request.user, confirmed=True)]
            friends += [fr.from_account for fr in FriendRelation.objects.filter(to_account=request.user, confirmed=True)]
            events = events.filter(eventrelation__account__in=friends).distinct()
        if sort == 'popularity':
            events = events.order_by('-numOfInterestedPeople' if order == 'desc' else 'numOfInterestedPeople')
        elif sort == 'date':
            events = events.order_by('-startTime' if order == 'desc' else 'startTime')
        results['events'] = list(events.values('id', 'name', 'details', 'startTime', 'endTime', 'location', 'society_id', 'numOfInterestedPeople'))

    # Search Users
    if search_type in ['', 'user']:
        users = Account.objects.filter(
            Q(firstName__icontains=query) | Q(lastName__icontains=query) | Q(email__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        results['users'] = list(users.values('accountID', 'firstName', 'lastName', 'email'))

    # Search Posts
    if search_type in ['', 'post']:
        posts = Post.objects.filter(
            Q(content__icontains=query) | Q(interests__name__icontains=query)
        ).distinct()
        if sort == 'date':
            posts = posts.order_by('-created_at' if order == 'desc' else 'created_at')
        results['posts'] = list(posts.values('id', 'content', 'created_at', 'author_id', 'society_id'))

    return JsonResponse(results)