# Generated by Django 5.2.1 on 2025-05-08 10:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0023_event_interests_post_interests_society_interests'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='pfp',
            field=models.ImageField(default='default.webp', max_length=500, upload_to=''),
        ),
    ]
