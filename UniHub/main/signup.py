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
    if request.user.is_authenticated:
        return Response({"error": "You are already logged in."}, status=403)

    email = request.data.get('email')
    if Account.objects.filter(email=email).exists():
        return Response({"error": "Email is already in use"}, status=400)
    
    accountID = request.data.get('accountID')
    if Account.objects.filter(accountID=accountID).exists():
        return Response({"error": "Student ID is already in use"}, status=400)
    
    serializer = SignupSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.data)

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model=Account
        fields = ['accountID', 'email', 'firstName', 'lastName', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        account = Account(accountID=validated_data["accountID"], email=validated_data['email'], firstName=validated_data["firstName"], lastName=validated_data["lastName"])
        account.set_password(validated_data['password'])
        account.save()
        return account