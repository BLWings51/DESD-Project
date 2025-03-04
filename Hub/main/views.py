import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from main.models import Account
from .models import *

# Create your views here.
def home(request):
    return render(request, 'index.html')

def index(request):
    return render(request, "index.html")  # Render React's index.html

@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse({"message": "Email and password are required"}, status=400)

            # Check if account exists
            user = Account.objects.filter(email=email).first()

            if not user:
                return JsonResponse({"message": "Account does not exist"}, status=404)

            if check_password(password, user.password):
                return JsonResponse({"message": "Login successful", "token": "your_generated_token"}, status=200)
            else:
                return JsonResponse({"message": "Invalid credentials"}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=400)

    return JsonResponse({"message": "Method not allowed"}, status=405)
