from django.urls import path, re_path
from django.shortcuts import render
from .views import index
from . import views

urlpatterns = [
    path("home/", views.home, name="home"),
    #path("", index, name="index"),  # Root URL serves React frontend
    re_path(r"^(?:.*)/?$", lambda request: render(request, "index.html")),  # Capture all routes

]
