"""
WSGI config for UniHub project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import dotenv
from pathlib import Path

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UniHub.settings')

application = get_wsgi_application()

dotenv.load_dotenv(Path(__file__).resolve().parent / ".env")