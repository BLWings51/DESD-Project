from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db.models import Q

COURSE_CHOICES = [
    ('CS', 'Computer Science'),
    ('ENG', 'Engineering'),
    ('BUS', 'Business'),
]

YEAR_CHOICES = [
    ('1', 'Year 1'),
    ('2', 'Year 2'),
    ('3', 'Year 3'),
    ('4', 'Year 4'),
    ('PG', 'Postgraduate'),
]

class InterestTag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class AccountManager(BaseUserManager):
    def create_user(self, accountID, password=None, **extra_fields):
        """Creates and returns a regular user"""
        if not accountID:
            raise ValueError("The account ID field must be set")
        
        user = self.model(accountID=accountID, **extra_fields)
        user.set_password(password)  # Hash password properly
        user.save(using=self._db)
        return user

    def create_superuser(self, accountID, password=None, **extra_fields):
        """Creates and returns a superuser"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(accountID, password, **extra_fields)

class Account(AbstractBaseUser, PermissionsMixin):
    accountID = models.IntegerField(unique=True)
    email = models.EmailField(unique=True)
    firstName = models.CharField(max_length=500)
    lastName = models.CharField(max_length=500)
    pfp = models.ImageField(max_length=500, upload_to='', default="default.webp")
    bio = models.CharField(max_length=3000, blank=True)
    adminStatus = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    
    address = models.CharField(max_length=500, blank=True)
    dob = models.DateField(null=True, blank=True)
    
    course = models.CharField(max_length=50, choices=COURSE_CHOICES, blank=True)
    year_of_course = models.CharField(max_length=20, choices=YEAR_CHOICES, blank=True)
    
    is_active = models.BooleanField(default=True)  # Required for Django user model
    is_staff = models.BooleanField(default=False)  # Required for admin access

    USERNAME_FIELD = "accountID"
    REQUIRED_FIELDS = []

    objects = AccountManager()

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
    interests = models.ManyToManyField(
        InterestTag, 
        related_name='accounts',
        blank=True,
        )

    def __str__(self):
        return str(self.accountID)

class FriendRelation(models.Model):
    from_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='friends_sent')
    to_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='friends_received')
    confirmed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('from_account', 'to_account')
        
    @staticmethod
    def are_friends(account1, account2):
        return FriendRelation.objects.filter(
            ((Q(from_account=account1) & Q(to_account=account2)) |
            (Q(from_account=account2) & Q(to_account=account1))) & Q(confirmed=True)).exists()

    def __str__(self):
        return f"{self.from_account} -> {self.to_account} ({'Confirmed' if self.confirmed else 'Pending'})"


class Society(models.Model):
    name = models.CharField(max_length=200)
    numOfInterestedPeople = models.IntegerField(default=0)
    description = models.CharField(max_length=2000)
    interests = models.ManyToManyField(InterestTag, related_name='societies', blank=True)
    pfp = models.ImageField(upload_to='', default='default.webp')

    def __str__(self):
        return self.name

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
    online = models.BooleanField(default=False)
    interests = models.ManyToManyField(InterestTag, related_name='events', blank=True)

class EventRelation(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)

class PostVisibility(models.Model):
    public = 'public'
    members_only = 'members_only'
    admin_only = 'admin_only'
    
    VISIBILITY_CHOICES = [
        (public, 'Public'),
        (members_only, 'Members Only'),
        (admin_only, 'Admin Only'),
    ]
    
    name = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default=public)
    
    def __str__(self):
        return self.name

class Post(models.Model):
    author = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='posts')
    society = models.ForeignKey(Society, on_delete=models.CASCADE, null=True, blank=True, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    interests = models.ManyToManyField(InterestTag, related_name='posts', blank=True)
    likes = models.ManyToManyField(Account, related_name='liked_posts', blank=True)
    visibility = models.ForeignKey(PostVisibility, on_delete=models.SET_NULL, null=True, default=None)

    class Meta:
        ordering = ['-created_at']

    def can_view(self, user):
        if not self.society:  # Personal post
            return True
        # For existing posts without visibility set, treat them as public
        if not self.visibility:
            return True
        if self.visibility.name == PostVisibility.public:
            return True
        if self.visibility.name == PostVisibility.members_only:
            return SocietyRelation.objects.filter(society=self.society, account=user).exists()
        if self.visibility.name == PostVisibility.admin_only:
            return SocietyRelation.objects.filter(
                society=self.society,
                account=user,
                adminStatus=True
            ).exists()
        return False

    def can_edit(self, user):
        if user == self.author:
            return True
            
        if self.society:
            return SocietyRelation.objects.filter(
                society=self.society,
                account=user,
                adminStatus=True
            ).exists()
            
        return False

class Notification(models.Model):
    recipient = models.ForeignKey(Account, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class ScheduledEventNotification(models.Model):
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    notification_time = models.DateTimeField()
    task_name = models.CharField(max_length=255) 

class LiveEventChat(models.Model):
    sender = models.ForeignKey(Account, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    text = models.CharField(max_length=2000)
    finalMessage = models.BooleanField(default=False)

class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(Account, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)