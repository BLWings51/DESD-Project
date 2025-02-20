from django.db import models

#creating models for the database
class Account(models.Model):
    email = models.CharField(max_length=200)
    password = models.CharField(max_length=2000)
    pfp = models.ImageField(max_length=500, default=None)
    
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
