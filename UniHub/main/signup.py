from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from django.core.mail import send_mail
from .models import Account, InterestTag

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
        send_mail(
            subject=f"Confirm Email",
            message=f"Please click the following link to confirm your email\n\n\nhttp://127.0.0.1:8000/api/confirmEmail/\n\n\n\nUniHub Management",
            from_email=None,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response(serializer.data)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def confirmEmail(request):
    user = request.user
    user.confirmed = True
    user.save()
    return Response({"success": True})


class SignupSerializer(serializers.ModelSerializer):
    interests = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )

    class Meta:
        model = Account
        fields = [
            'accountID', 'email', 'firstName', 'lastName', 'password',
            'dob', 'course', 'year_of_course', 'address', 'interests'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        interests = validated_data.pop('interests', [])
        account = Account(
            accountID=validated_data["accountID"],
            email=validated_data['email'],
            firstName=validated_data["firstName"],
            lastName=validated_data["lastName"],
            dob=validated_data.get("dob"),
            course=validated_data.get("course"),
            year_of_course=validated_data.get("year_of_course"),
            address=validated_data.get("address", "")
        )
        account.set_password(validated_data['password'])
        account.save()
        # Handle interests
        tags = []
        
        for name in interests:
            tag = InterestTag.objects.filter(name__iexact=name).first()
            if tag is None:
                tag = InterestTag.objects.create(name=name)
            tags.append(tag)
        return account