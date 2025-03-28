from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializer import SignupSerializer
from .models import Account
from .permissions import CustomIsAdminUser

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            account = authenticate(request, username=email, password=password)

            if not account:
                return Response({"message": "Invalid email or password"}, status=400)
            
            response = super().post(request, *args, **kwargs)
            tokens = response.data
            access_token = tokens['access']
            refresh_token = tokens['refresh']

            res = Response()

            res.data = {"success":True}

            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False, # We're not using HTTPS for development
                path="/"
            )

            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False, # We're not using HTTPS for development
                path="/"
            )

            return res
        except:
            return Response({"success":False}, status=400)
        
class CustomRefreshTokenView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            account = authenticate(request, username=email, password=password)

            if not account:
                return Response({"message": "Account no longer exists"}, status=400)
            refresh_token = request.COOKIES.get('refresh_token')
            request_data = request.data.copy()
            request_data['refresh'] = refresh_token

            request._full_data = request_data

            response = super().post(request, *args, **kwargs)

            tokens = response.data
            access_token = tokens['access']

            res = Response()

            res.data = {'refreshed':True}

            res.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="None",
                path="/"
            )

            return res

        except:
            return Response({'refreshed':False}, status=400)
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response()
        res.data = {'success':True}
        res.delete_cookie('access_token', path="/", samesite='None')
        res.delete_cookie('refresh_token', path="/", samesite='None')
        return res
    except:
        return Response({'success':False}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    return Response({'authenticated':True})

@api_view(['POST'])
@permission_classes([CustomIsAdminUser])
def is_admin(request):
    return Response({"admin":True})

