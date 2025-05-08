from rest_framework import serializers, status, viewsets
from .models import Post
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSocietyAdmin, IsAdminOrSocietyAdmin
from rest_framework.response import Response
from .models import Post, Society, SocietyRelation, InterestTag
from .comments import CommentSerializer
from .signup import InterestTagSerializer

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
    queryset = PostViewSet.queryset.filter(society__name=society_name)
    serializer = PostViewSet.serializer_class(queryset, many=True, context={'request': request})
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
@permission_classes([IsAuthenticated])
def update_post(request, society_name, post_id):
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

# Check if user can delete a post
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def can_delete_post(request, society_name, post_id):
    try:
        # Get the post and join with Account table to check author
        post = Post.objects.select_related('author').get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is the author by comparing accountID
    is_author = request.user.accountID == post.author.accountID
    is_admin = getattr(request.user, 'adminStatus', False)
    is_society_admin = SocietyRelation.objects.filter(
        society__name=society_name,
        account=request.user,
        adminStatus=True
    ).exists()

    can_delete = is_author or is_admin or is_society_admin
    return Response({"can_delete": can_delete}, status=status.HTTP_200_OK)

# Delete a post
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, society_name, post_id):
    try:
        # Get the post and join with Account table to check author
        post = Post.objects.select_related('author').get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is the author by comparing accountID
    is_author = request.user.accountID == post.author.accountID
    is_admin = getattr(request.user, 'adminStatus', False)
    is_society_admin = SocietyRelation.objects.filter(
        society__name=society_name,
        account=request.user,
        adminStatus=True
    ).exists()

    if not (is_author or is_admin or is_society_admin):
        return Response({"error": "You are not allowed to delete this post."}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({"message": "Post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

# Like posts
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, society_name, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)

    post.likes.add(request.user)
    return Response({ "message": f"{request.user.firstName} {request.user.lastName} liked the post"}, status=200)

# Dislike posts
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dislike_post(request, society_name, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)
    


    post.likes.remove(request.user)
    return Response({ "message": f"{request.user.firstName} {request.user.lastName} disliked the post"}, status=200)


# serialisers


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    interests = InterestTagSerializer(many=True, required=False)
    interests = serializers.ListField(
        child=serializers.CharField(), required=False, default=list, write_only=True
    )
    interests_display = serializers.SerializerMethodField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    liked_by_display = serializers.SerializerMethodField(read_only=True)


    class Meta:
        model = Post
        fields = ['id', 'author', 'author_name', 'society', 'content', 'created_at', 'interests', 'interests_display', 'likes_count', 'liked_by_user', 'liked_by_display', 'comments']
        read_only_fields = ['created_at']

    def get_author_name(self, obj):
        return f"{obj.author.firstName} {obj.author.lastName}"

    def get_interests_display(self, obj):
        return [tag.name for tag in obj.interests.all()]
    
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.likes.filter(id=request.user.id).exists()
        return False
    
    def get_liked_by_display(self, obj):
        return [f"{user.firstName} {user.lastName}" for user in obj.likes.all()]



    def create(self, validated_data):
        interests_data = validated_data.pop('interests', [])
        post = Post.objects.create(**validated_data)
        tags = []
        for interest_data in interests_data:
            tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
            tags.append(tag)

        post.interests.set(tags)
        post.save()
        return post

    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if interests_data is not None:
            tags = []
            for interest_data in interests_data:
                tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
                tags.append(tag)

            instance.interests.set(tags)
        instance.save()
        return instance
    
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer