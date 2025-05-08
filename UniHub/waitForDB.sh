#!/bin/sh
set -e

host="$1"
shift

echo "Waiting for Postgres at $host:5432..."
until pg_isready -h "$host" -p 5432; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec "$@"