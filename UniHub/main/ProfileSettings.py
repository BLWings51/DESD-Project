from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Account
from rest_framework import serializers

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        
        model=Account
        fields = ['bio', 'firstName', 'lastName', 'email', 'pfp', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validateEmail(self, value):
        user = self.context['request'].user
        
        if Account.objects.exclude(pk=user.account.pk).filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use")
        return value
    
    def update(self, instance, validated_data):
        instance.bio = validated_data.get('bio', instance.bio)
        instance.firstName = validated_data.get('firstName', instance.firstName)
        instance.lastName = validated_data.get('lastName', instance.lastName)
        instance.email = validated_data.get('email', instance.email)
        instance.pfp = validated_data.get('pfp', instance.pfp)
        password = validated_data.get('password', None)
        
        if password:
            instance.set_password(password)
        instance.save()
        return instance


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def UpdateProfileView(request):
    account = request.user
    serializer = UpdateProfileSerializer(account, data=request.data, partial=True, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

