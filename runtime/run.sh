#!/bin/sh
set -e

cd /app

if [ "$#" -gt 0 ]; then
  echo "Using command: $*"
  exec "$@"
fi

COMMAND="${COMMAND:-npm run start}"

echo "Starting nodejs"
echo "Using command: $COMMAND"

exec sh -c "$COMMAND"
