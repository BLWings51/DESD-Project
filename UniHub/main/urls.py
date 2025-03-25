from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from main import signup, views, ProfileSettings

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', views.CustomRefreshTokenView.as_view(), name="token_refresh"),
    path('logout/', views.logout),
    path('authenticated/', views.is_authenticated),
    path('signup/', signup.SignupView),
    path('ProfileSettings/', ProfileSettings.UpdateProfileView),
    path('admin_check/', views.is_admin),
]

