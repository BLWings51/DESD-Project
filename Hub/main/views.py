import json
from django.http import JsonResponse
from django.shortcuts import render, HttpResponse
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

            # Check if user exists
            try:
                user = Account.objects.get(email=email)
                if user.check_password(password):
                    return JsonResponse({"message": "Login successful"}, status=200)
                else:
                    return JsonResponse({"detail": "Invalid credentials"}, status=400)
            except Account.DoesNotExist:
                return JsonResponse({"detail": "Account does not exist"}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

    return JsonResponse({"detail": "Method not allowed"}, status=405)