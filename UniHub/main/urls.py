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
    path('Profile/Delete/', Profile.deleteProfile),
    path('admin_check/', views.is_admin),
    path('Profile/', Profile.getAccountDetails),
    path('Profile/<str:account_ID>/', Profile.getAccountDetails),
    path('Societies/', society.getAllSocieties, name='society-list-create'),
    path('Societies/CreateSociety', society.society_create, name='society-list-create'),
    path('Societies/<str:society_name>/', society.getSocietyDetails, name='society-detail'),
    path('Societies/<str:society_name>/UpdateSociety/', society.UpdateSocietyView, name="update-society"),
    path('Societies/<str:society_name>/DeleteSociety/', society.DeleteSocietyView, name="delete-society"),
    path('Societies/<str:society_name>/join/', society.join_society, name='join-society'),
    path('Societies/<str:society_name>/leave/', society.leave_society, name='leave-society'),
    path('Societies/<str:society_name>/CreateEvent/', Events.CreateEvent),
    path('Societies/<str:society_name>/Events/', Events.getAllEvents),
]
