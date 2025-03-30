from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from main import signup, views, Profile, society, Events

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', views.CustomRefreshTokenView.as_view(), name="token_refresh"),
    path('logout/', views.logout),
    path('authenticated/', views.is_authenticated),
    path('signup/', signup.SignupView),
    path('Profile/Settings/', Profile.UpdateProfileView),
    path('admin_check/', views.is_admin),
    path('Profile/', Profile.getAccountDetails),
    path('createSociety/', society.SocietyListCreateView.as_view(), name='society-list-create'),
    path('Societies/<int:pk>/', society.SocietyDetailView.as_view(), name='society-detail'),
    path('Profile/<str:account_ID>/', Profile.getAccountDetails),
    path('Societies/<str:society_name>/CreateEvent/', Events.CreateEvent),
    path('Societies/<str:society_name>/Events/', Events.getAllEvents),
    path('Societies/<str:society_name>/IsSocietyAdmin/', views.is_society_admin),
    path('Societies/<str:society_name>/<int:eventID>/DeleteEvent/', Events.deleteEvent),
    path('Societies/<str:society_name>/<int:eventID>/UpdateEvent/', Events.UpdateEvent),
    path('Societies/<str:society_name>/<int:eventID>/', Events.getSingleEvent)
]
