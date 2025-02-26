from django.shortcuts import render, HttpResponse
from .models import *

# Create your views here.
def home(request):
    return render(request, 'index.html')

def index(request):
    return render(request, "index.html")  # Render React's index.html