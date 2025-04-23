from rest_framework import serializers, status
from .models import Post
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSocietyAdmin
from rest_framework.response import Response
from .models import Post, Society

# Get posts from user's friends
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends_posts(request):
    user = request.user
    # Assuming you have a `friends` relation (adjust as needed)
    friends = user.friends.all()  # Replace with actual logic
    posts = Post.objects.filter(author__in=friends, society=None)
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

# Get posts for a specific society
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_society_posts(request, society_name):
    posts = Post.objects.filter(society__name=society_name)
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request, society_name):
    data = request.data.copy()
    data['author'] = request.user.id

    # Optional: link to a society by name
    if society_name:
        try:
            society = Society.objects.get(name=society_name)
            data['society'] = society.id
        except Society.DoesNotExist:
            return Response({"error": "Society not found"}, status=404)

    serializer = PostSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)

# Update post
@api_view(['PATCH'])
@permission_classes([IsSocietyAdmin])
def update_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.user != post.author:
        return Response({"error": "You are not allowed to edit this post."}, status=status.HTTP_403_FORBIDDEN)

    serializer = PostSerializer(post, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Delete a post
@api_view(['DELETE'])
@permission_classes([IsSocietyAdmin])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.user != post.author:
        return Response({"error": "You are not allowed to delete this post."}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({"message": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# serialisers

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'author_name', 'society', 'content', 'created_at']

    def get_author_name(self, obj):
        return f"{obj.author.firstName} {obj.author.lastName}"
