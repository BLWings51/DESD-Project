from rest_framework.permissions import BasePermission
from .models import SocietyRelation, Society

class CustomIsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'adminStatus', False))
    
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