#!/usr/bin/sh

if [ -f .env.dev ]; then
  # swap to dev
  mv .env .env.prod
  mv .env.dev .env
  echo "Switched to development .env"
else
  # swap to prod
  mv .env .env.dev
  mv .env.prod .env
  echo "Switched to production .env"
fi

