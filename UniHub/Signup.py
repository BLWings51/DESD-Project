# serializers.py
from rest_framework import serializers, status
from main.models import Account
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import path


# WILL BE MOVED TO SERIALIZERS.PY
class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'email', 'password', 'pfp']
        #extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        account = Account.objects.create(
            email=validated_data['email'],
            password=validated_data['password'],
            pfp = None
        )
        return account
    
#WILL BE MOVED TO VIEWS.PY
class SignupView(APIView):
    def post(self, request):
        email = request.data.get('email')

        # checking if the email already exists
        if Account.objects.filter(email=email).exists():
            return Response({"error": "Email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

        # Serialize and create new user if email doesn't exist
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#WILL BE MOVED TO URLS.PY
urlpatterns = [path('api/signup/', SignupView.as_view(), name='signup'),] # swap out details in here to correspond to React page names

