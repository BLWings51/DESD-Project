from django.shortcuts import render
from rest_framework import serializers, status
from main.models import Account
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import path
from passlib.hash import sha256_crypt
from rest_framework.exceptions import AuthenticationFailed

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'email', 'password', 'pfp', 'adminStatus']

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'email', 'password', 'pfp', 'adminStatus']

    def create(self, validated_data):
        account = Account.objects.create(
            email=validated_data['email'],
            password=sha256_crypt.hash(validated_data['password']),
            pfp = None
        )
        return account