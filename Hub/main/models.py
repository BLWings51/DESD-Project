from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class AccountManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("Users must have an email address")
        
        user = self.model(email=self.normalize_email(email))
        user.set_password(password)  # Hash password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None):
        user = self.create_user(email, password)
        user.is_admin = True
        user.save(using=self._db)
        return user

class Account(AbstractBaseUser):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=2000)  # Password will be hashed
    pfp = models.ImageField(max_length=500, default=None, blank=True, null=True)

    objects = AccountManager()

    USERNAME_FIELD = "email"  # Use email for authentication
    REQUIRED_FIELDS = []  # Django expects this attribute

    def __str__(self):
        return self.email


    
class Society(models.Model):
    name = models.CharField(max_length=200)
    numOfInterestedPeople = models.IntegerField()
    description = models.CharField(max_length=2000)

class SocietyRelation(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    adminStatus = models.BooleanField(default=False)

class Event(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE)
    startTime = models.DateTimeField()
    endTime = models.DateTimeField()
    Location = models.CharField(max_length=200)
