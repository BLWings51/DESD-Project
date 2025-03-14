from rest_framework import serializers
from .models import Account

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'email', 'password', 'pfp', 'adminStatus']

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model=Account
        fields = ['email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        account = Account(email=validated_data['email'])
        account.set_password(validated_data['password'])
        account.save()
        return account