from rest_framework import serializers, status, viewsets
from .models import Post
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import IsSocietyAdmin, IsAdminOrSocietyAdmin
from rest_framework.response import Response
from .models import Post, Society, SocietyRelation, InterestTag, PostVisibility
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
    try:
        society = Society.objects.get(name=society_name)
        posts = Post.objects.filter(society=society)
        
        # Filter posts based on user's permissions
        visible_posts = [post for post in posts if post.can_view(request.user)]
        
        serializer = PostSerializer(visible_posts, many=True, context={'request': request})
        return Response(serializer.data)
    except Society.DoesNotExist:
        return Response({"error": "Society not found"}, status=404)

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

            # Check if user is a member of the society using SocietyRelation
            if not SocietyRelation.objects.filter(society=society, account=request.user).exists():
                return Response({"error": "You must be a member of this society to post."}, status=403)

            # Check if user has permission to create posts with the requested visibility
            visibility_data = data.get('visibility', PostVisibility.public)
            if isinstance(visibility_data, dict):
                visibility = visibility_data.get('name', PostVisibility.public)
            else:
                visibility = visibility_data
            if visibility == PostVisibility.admins:
                is_admin = SocietyRelation.objects.filter(
                    society=society,
                    account=request.user,
                    adminStatus=True
                ).exists()
                if not is_admin:
                    return Response({"error": "Only society admins can create admin-only posts"}, status=403)

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

    if not post.can_edit(request.user):
        return Response({"error": "You are not allowed to edit this post."}, status=status.HTTP_403_FORBIDDEN)

    # Handle both dict and string for visibility
    visibility_data = request.data.get('visibility')
    if isinstance(visibility_data, dict):
        visibility_name = visibility_data.get('name')
    else:
        visibility_name = visibility_data

    if visibility_name == PostVisibility.admins:
        if post.society:
            is_admin = SocietyRelation.objects.filter(
                society=post.society,
                account=request.user,
                adminStatus=True
            ).exists()
            if not is_admin:
                return Response({"error": "Only society admins can set admin-only visibility"}, status=403)

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
        post = Post.objects.select_related('author').get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    can_delete = post.can_edit(request.user)
    return Response({"can_delete": can_delete}, status=status.HTTP_200_OK)

# Delete a post
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, society_name, post_id):
    try:
        post = Post.objects.select_related('author').get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if not post.can_edit(request.user):
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
    society_name = serializers.SerializerMethodField()
    interests = InterestTagSerializer(many=True, required=False)
    #interests = serializers.ListField(    child=serializers.CharField(), required=False, default=list, write_only=True)
    interests_display = serializers.SerializerMethodField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    liked_by_display = serializers.SerializerMethodField(read_only=True)
    visibility = serializers.CharField(required=False)
    can_view = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)


    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_name', 'society', 'society_name', 'content', 'created_at',
            'interests', 'interests_display', 'likes_count', 'liked_by_user', 'liked_by_display',
            'comments', 'visibility', 'can_view', 'can_edit', 'image'
        ]
        read_only_fields = ['created_at']

    def get_author_name(self, obj):
        return f"{obj.author.firstName} {obj.author.lastName}"

    def get_society_name(self, obj):
        return obj.society.name if obj.society else None

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

    def get_can_view(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_view(request.user)
        return False

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.can_edit(request.user)
        return False

    def get_visibility(self, obj):
        if not obj.visibility:
            return PostVisibility.public
        return obj.visibility.name

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def create(self, validated_data):
        interests_data = validated_data.pop('interests', [])
        visibility_data = validated_data.pop('visibility', None)
        # Accept both dict and string for visibility
        if visibility_data:
            if isinstance(visibility_data, dict):
                visibility_name = visibility_data.get('name')
            else:
                visibility_name = visibility_data
            visibility, _ = PostVisibility.objects.get_or_create(name=visibility_name)
        else:
            visibility, _ = PostVisibility.objects.get_or_create(name=PostVisibility.public)
        post = Post.objects.create(**validated_data, visibility=visibility)
        tags = []
        for interest_data in interests_data:
            tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
            tags.append(tag)
        post.interests.set(tags)
        post.save()
        return post

    def update(self, instance, validated_data):
        interests_data = validated_data.pop('interests', None)
        visibility_data = validated_data.pop('visibility', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if visibility_data:
            if isinstance(visibility_data, dict):
                visibility_name = visibility_data.get('name')
            else:
                visibility_name = visibility_data
            visibility, _ = PostVisibility.objects.get_or_create(name=visibility_name)
            instance.visibility = visibility
        if interests_data is not None:
            tags = []
            for interest_data in interests_data:
                tag, _ = InterestTag.objects.get_or_create(name=interest_data['name'])
                tags.append(tag)
            instance.interests.set(tags)
        instance.save()
        return instance

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        visibility = data.get('visibility', PostVisibility.public)
        if isinstance(visibility, dict):
            ret['visibility'] = visibility.get('name', PostVisibility.public)
        else:
            ret['visibility'] = visibility
        return ret

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer