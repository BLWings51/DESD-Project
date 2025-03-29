from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

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