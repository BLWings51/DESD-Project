#!/bin/sh
set -e

# Wait for the database to be ready
./waitForDB.sh db

# Make migrations and migrate
python manage.py makemigrations
python manage.py migrate

# Check account count robustly (get only the last line, which is the count)
ACCOUNT_COUNT=$(python manage.py shell -c 'from main.models import Account; print(Account.objects.count())' 2>/dev/null | tail -n 1)
echo "Account count: $ACCOUNT_COUNT"
if [ "$ACCOUNT_COUNT" = "0" ]; then
  echo "Loading initial data from dumpdata.json..."
  python manage.py loaddata dumpdata.json
else
  echo "Database already has data, skipping loaddata."
fi

# Start the server!
python manage.py runserver 0.0.0.0:8000