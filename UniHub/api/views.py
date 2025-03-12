from django.shortcuts import render
from rest_framework import serializers, status
from main.models import Account
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.urls import path
from passlib.hash import sha256_crypt
from rest_framework.exceptions import AuthenticationFailed
from api.serializers import LoginSerializer, SignupSerializer
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
def LoginView(request):
    email = request.data.get('email')
    password = request.data.get('password')
    account = Account.objects.filter(email=email).first()

    if not account or not sha256_crypt.verify(password, account.password):
        return Response({"message": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(account)
    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": LoginSerializer(account).data
    }, status=status.HTTP_200_OK)
       
@api_view(['POST'])
def SignupView(request):
    email = request.data.get('email')

    # checking if the email already exists
    if Account.objects.filter(email=email).exists():
        return Response({"error": "Email is already in use"}, status=status.HTTP_400_BAD_REQUEST)

    # Serialize and create new user if email doesn't exist
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
