from rest_framework import serializers, status, viewsets
from .models import Post
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSocietyAdmin, IsAdminOrSocietyAdmin
from rest_framework.response import Response
from .models import Comment, SocietyRelation

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    data = request.data.copy()
    data['author'] = request.user.id     
    data['post'] = post_id            

    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_comment(request, comment_id, post_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.user != comment.author:
        return Response({"error": "You are not allowed to edit this comment."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CommentSerializer(comment, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def can_delete_comment(request, post_id, comment_id):
    try:
        comment = Comment.objects.select_related('author', 'post__society').get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    is_author = request.user.accountID == comment.author.accountID
    is_admin = getattr(request.user, 'adminStatus', False)
    is_society_admin = SocietyRelation.objects.filter(
        society=comment.post.society,
        account=request.user,
        adminStatus=True
    ).exists()

    can_delete = is_author or is_admin or is_society_admin
    return Response({"can_delete": can_delete}, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, post_id, comment_id):
    try:
        comment = Comment.objects.select_related('author', 'post__society').get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    is_author = request.user.accountID == comment.author.accountID
    is_admin = getattr(request.user, 'adminStatus', False)
    is_society_admin = SocietyRelation.objects.filter(
        society=comment.post.society,
        account=request.user,
        adminStatus=True
    ).exists()

    if not (is_author or is_admin or is_society_admin):
        return Response({"error": "You are not allowed to delete this comment."}, status=status.HTTP_403_FORBIDDEN)

    comment.delete()
    return Response({"message": "Comment deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# serialisers


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_name', 'post', 'content', 'created_at']
        read_only_fields = ['author_name', 'created_at']
