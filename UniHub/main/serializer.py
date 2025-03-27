from rest_framework import serializers
from .models import Account

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