from django.urls import path, re_path
from django.shortcuts import render
from .views import LoginView, SignupView
from . import views

urlpatterns = [
    path('api/login/', views.LoginView, name='login'),
    path('api/signup/', views.SignupView, name='signup'),
    #re_path(r"^(?:.*)/?$", lambda request: render(request, "index.html")),  # Capture all routes

]