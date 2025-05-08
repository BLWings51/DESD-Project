from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404
from django.db.models import Q

from .models import Account, FriendRelation
from .Profile import GetAccountSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request, to_account_id):
    from_account = request.user
    to_account = get_object_or_404(Account, accountID=to_account_id)
    
    if from_account == to_account:
        return Response({"error": "You cannot add yourself as a friend."}, status=400)
    if FriendRelation.objects.filter(
        (Q(from_account=from_account, to_account=to_account) | Q(from_account=to_account, to_account=from_account))
    ).exists():
        return Response({"error": "Friend request already exists or you are already friends."}, status=400)
    
    FriendRelation.objects.create(from_account=from_account, to_account=to_account, confirmed=False)
    return Response({"message": "Friend request sent."}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, from_account_id):
    to_account = request.user
    from_account = get_object_or_404(Account, accountID=from_account_id)
    
    try:
        relation = FriendRelation.objects.get(from_account=from_account, to_account=to_account, confirmed=False)
        relation.confirmed = True
        relation.save()
        return Response({"message": "Friend request accepted."}, status=200)
    except FriendRelation.DoesNotExist:
        return Response({"error": "No pending friend request found."}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_friend_request(request, from_account_id):
    to_account = request.user
    from_account = get_object_or_404(Account, accountID=from_account_id)
    
    try:
        relation = FriendRelation.objects.get(from_account=from_account, to_account=to_account, confirmed=False)
        relation.delete()
        return Response({"message": "Friend request declined."}, status=200)
    except FriendRelation.DoesNotExist:
        return Response({"error": "No pending friend request found."}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request, account_id):
    user = request.user
    other = get_object_or_404(Account, accountID=account_id)
    relation = FriendRelation.objects.filter(
        (Q(from_account=user, to_account=other) | Q(from_account=other, to_account=user)) & Q(confirmed=True)
    ).first()
    
    if relation:
        relation.delete()
        return Response({"message": "Friend removed."}, status=200)
    return Response({"error": "You are not friends."}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_friends(request):
    user = request.user
    relations = FriendRelation.objects.filter(
        (Q(from_account=user) | Q(to_account=user)) & Q(confirmed=True)
    )
    
    friends = []
    
    for rel in relations:
        if rel.from_account == user:
            friends.append(rel.to_account)
        else:
            friends.append(rel.from_account)
    
    serializer = GetAccountSerializer(friends, many=True, context={'request': request})
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def incoming_requests(request):
    user = request.user
    incoming = FriendRelation.objects.filter(to_account=user, confirmed=False)
    senders = [rel.from_account for rel in incoming]
    serializer = GetAccountSerializer(senders, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def outgoing_requests(request):
    user = request.user
    outgoing = FriendRelation.objects.filter(from_account=user, confirmed=False)
    receivers = [rel.to_account for rel in outgoing]
    serializer = GetAccountSerializer(receivers, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def are_friends(request, account_id):
    user = request.user
    other = get_object_or_404(Account, accountID=account_id)
    are_friends = FriendRelation.are_friends(user, other)
    return Response({"are_friends": are_friends})
