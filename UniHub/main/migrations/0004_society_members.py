# Generated by Django 5.1.6 on 2025-03-28 23:03

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_account_bio_account_firstname_account_lastname_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='society',
            name='members',
            field=models.ManyToManyField(blank=True, related_name='societies', to=settings.AUTH_USER_MODEL),
        ),
    ]
