from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import SocietyRelation, Society

class CustomIsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'adminStatus', False))
    
class IsAdmin(BasePermission):
    """
    Custom permission to allow only admins to access the view.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and getattr(request.user, 'adminStatus', False)):
            raise PermissionDenied({"AuthError": "No members should gain access to this page, ADMINS ONLY!!"})
        return True
    
class IsSocietyAdmin(BasePermission):
    def has_permission(self, request, view):
        society_name = view.kwargs.get("society_name")
        user = request.user

        if not user.is_authenticated:
            return False
        
        society = Society.objects.filter(name=society_name).first()
        if not society:
            return False
        
        societyRelation = SocietyRelation.objects.filter(society=society, account=user, adminStatus=True).first()
        
        if not societyRelation:
            return False
        else:
            return True

class IsAdminOrSocietyAdmin(BasePermission):
    """
    Custom permission to allow both global admins and society admins to perform actions.
    """
    def has_permission(self, request, view):
        user = request.user
        
        if not user.is_authenticated:
            return False
            
        # Check if user is a global admin
        if getattr(user, 'adminStatus', False):
            return True
            
        # Check if user is a society admin
        society_name = view.kwargs.get("society_name")
        if not society_name:
            return False
            
        society = Society.objects.filter(name=society_name).first()
        if not society:
            return False
            
        societyRelation = SocietyRelation.objects.filter(society=society, account=user, adminStatus=True).first()
        return bool(societyRelation)
