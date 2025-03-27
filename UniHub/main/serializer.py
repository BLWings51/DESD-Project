from rest_framework import serializers
from .models import Account, Society

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model=Account
        fields = ['email', 'password', 'firstName', 'lastName']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        account = Account(email=validated_data['email'], firstName=validated_data['firstName'], lastName=validated_data['lastName'])
        account.set_password(validated_data['password'])
        account.save()
        return account
    

class SocietySerializer(serializers.ModelSerializer):
    class Meta:
        model = Society
        fields = ['name', 'numOfInterestedPeople', 'description']

    def create(self, validated_data):
        society = Society.objects.create(**validated_data)
        society.save()
        return society
    
    def validate_name(self, value):
        if Society.objects.filter(name=value).exists():
            raise serializers.ValidationError("Society with this name already exists.")
        return value