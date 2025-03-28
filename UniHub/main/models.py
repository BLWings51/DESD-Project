from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class AccountManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """Creates and returns a regular user"""
        if not email:
            raise ValueError("The Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Hash password properly
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Creates and returns a superuser"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(email, password, **extra_fields)

class Account(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    firstName = models.CharField(max_length=500)
    lastName = models.CharField(max_length=500)
    pfp = models.ImageField(max_length=500, upload_to="profile_pics", default="default.webp")
    bio = models.CharField(max_length=3000, blank=True)
    adminStatus = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)  # Required for Django user model
    is_staff = models.BooleanField(default=False)  # Required for admin access

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = AccountManager()

    # ✅ Fix: Prevent field clashes by adding `related_name`
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="account_users",
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="account_users",
        blank=True,
    )

    def __str__(self):
        return self.email

    
class Society(models.Model):
    name = models.CharField(max_length=200)
    numOfInterestedPeople = models.IntegerField(default=0)
    description = models.CharField(max_length=2000)

class SocietyRelation(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    adminStatus = models.BooleanField(default=False)

class Event(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    name = models.CharField(max_length=400)
    details = models.CharField(max_length=4000)
    startTime = models.DateTimeField()
    endTime = models.DateTimeField()
    location = models.CharField(max_length=200)
    numOfInterestedPeople = models.IntegerField(default=0)
