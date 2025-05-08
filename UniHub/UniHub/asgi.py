"""
ASGI config for UniHub project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import dotenv
from pathlib import Path

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UniHub.settings')

application = get_asgi_application()

dotenv.load_dotenv(Path(__file__).resolve().parent / ".env")
