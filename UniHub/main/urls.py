from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import CustomTokenObtainPairView, CustomRefreshTokenView, logout, is_authenticated, SignupView, is_admin

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', CustomRefreshTokenView.as_view(), name="token_refresh"),
    path('logout/', logout),
    path('authenticated/', is_authenticated),
    path('admin_check/', is_admin),
    path('signup/', SignupView),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)