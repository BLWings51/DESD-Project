#!/bin/bash
set -e

echo "Waiting for PostgreSQL to start..."
until pg_isready -U "$POSTGRES_USER" -h "localhost" -p 5432; do
  sleep 2
done
echo "PostgreSQL started. Running initialization..."

apt-get update && apt-get install -y python3 python3-pip
pip3 install django psycopg2-binary

mkdir -p /app_temp
cat > /app_temp/manage.py <<EOF
#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "temp_settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
EOF

cat > /app_temp/temp_settings.py <<EOF
import os
DEBUG = True
BASE_DIR = '/app_temp'
SECRET_KEY = 'temporary_secret_key'
ALLOWED_HOSTS = ['*']
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'mydatabase'),
        'USER': os.environ.get('POSTGRES_USER', 'myuser'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'mypassword'),
        'HOST': 'localhost',
        'PORT': 5432,
    }
}
INSTALLED_APPS = []
ROOT_URLCONF = ''
EOF

export DJANGO_SETTINGS_MODULE=temp_settings
cd /app_temp

# Copy dumpdata.json from the mounted UniHub directory
if [ -f /app_host/dumpdata.json ]; then
  cp /app_host/dumpdata.json /app_temp/dumpdata.json
  python manage.py loaddata /app_temp/dumpdata.json
  echo "Initial data loaded."
else
  echo "dumpdata.json not found in /app_host. Skipping data loading."
fi