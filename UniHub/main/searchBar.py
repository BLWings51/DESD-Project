from django.http import JsonResponse
from django.db.models import Q
from main.models import Society, Event, Account, Post, FriendRelation, SocietyRelation
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .post import PostSerializer

# Search function to handle search queries for societies, events, users, and posts
@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '')  # Get the search query from the request
    search_type = request.GET.get('type', '')  # Get the type of search
    sort = request.GET.get('sort', '')  # Get the sort parameter
    order = request.GET.get('order', 'desc')  # Get the order parameter
    friends_only = request.GET.get('friends_only', 'false').lower() == 'true'  # Get friends_only parameter
    tags = request.GET.getlist('tags', [])  # Get tags parameter

    results = {
        'societies': [],
        'events': [],
        'users': [],
        'posts': []
    }

    # Search Societies
    if search_type in ['', 'society']:
        societies = Society.objects.all()
        if query:
            societies = societies.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            )
        if tags:
            societies = societies.filter(interests__name__in=tags).distinct()
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
        events = Event.objects.all()
        if query:
            events = events.filter(
                Q(name__icontains=query) |
                Q(details__icontains=query) |
                Q(location__icontains=query)
            )
        if tags:
            events = events.filter(interests__name__in=tags).distinct()
        if friends_only and request.user.is_authenticated:
            friends = [fr.to_account for fr in FriendRelation.objects.filter(from_account=request.user, confirmed=True)]
            friends += [fr.from_account for fr in FriendRelation.objects.filter(to_account=request.user, confirmed=True)]
            events = events.filter(eventrelation__account__in=friends).distinct()
        if sort == 'popularity':
            events = events.order_by('-numOfInterestedPeople' if order == 'desc' else 'numOfInterestedPeople')
        elif sort == 'date':
            events = events.order_by('-startTime' if order == 'desc' else 'startTime')
        results['events'] = list(events.values('id', 'name', 'details', 'startTime', 'endTime', 'location'))

    # Search Users
    if search_type in ['', 'user']:
        users = Account.objects.all()
        if query:
            users = users.filter(
                Q(firstName__icontains=query) |
                Q(lastName__icontains=query) |
                Q(email__icontains=query)
            )
        if tags:
            users = users.filter(interests__name__in=tags).distinct()
        if friends_only and request.user.is_authenticated:
            friends = [fr.to_account for fr in FriendRelation.objects.filter(from_account=request.user, confirmed=True)]
            friends += [fr.from_account for fr in FriendRelation.objects.filter(to_account=request.user, confirmed=True)]
            users = users.filter(id__in=[f.id for f in friends])
        results['users'] = list(users.values('accountID', 'firstName', 'lastName', 'email'))

    # Search Posts
    if search_type in ['', 'post']:
        posts = Post.objects.all()
        if query:
            posts = posts.filter(
                Q(content__icontains=query)
            )
        if tags:
            posts = posts.filter(interests__name__in=tags).distinct()
        if friends_only and request.user.is_authenticated:
            friends = [fr.to_account for fr in FriendRelation.objects.filter(from_account=request.user, confirmed=True)]
            friends += [fr.from_account for fr in FriendRelation.objects.filter(to_account=request.user, confirmed=True)]
            posts = posts.filter(author__in=friends)
        if sort == 'date':
            posts = posts.order_by('-created_at' if order == 'desc' else 'created_at')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        results['posts'] = serializer.data

    return JsonResponse(results)