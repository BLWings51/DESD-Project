from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from .views import *
from .society import *

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', CustomRefreshTokenView.as_view(), name="token_refresh"),
    path('logout/', logout),
    path('authenticated/', is_authenticated),
    path('signup/', SignupView),
    path('society/', SocietyListCreateView.as_view(), name='society-list-create'),
    path('society/<int:pk>/', SocietyDetailView.as_view(), name='society-detail'),
]