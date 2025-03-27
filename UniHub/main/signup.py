from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework import serializers
from .models import Account

@api_view(['POST'])
@permission_classes([AllowAny])
def SignupView(request):
    email = request.data.get('email')
    if Account.objects.filter(email=email).exists():
        return Response({"error": "Email is already in use"}, status=400)
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.data)

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model=Account
        fields = ['email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        account = Account(email=validated_data['email'])
        account.set_password(validated_data['password'])
        account.save()
        return account