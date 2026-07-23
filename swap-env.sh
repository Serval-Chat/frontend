#!/usr/bin/sh

set -eu

DEV_ENV='VITE_API_BASE_URL=http://127.0.0.1:3000/
VITE_WS_BASE_URL=ws://127.0.0.1:3000/
VITE_LIVEKIT_URL=http://127.0.0.1:17880
VITE_MAX_MESSAGE_LENGTH=10000
VITE_ALTERNATIVE_URLS=["localhost:5173"]
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA'

PROD_ENV='VITE_API_BASE_URL=https://ser.chat/
VITE_WS_BASE_URL=wss://ser.chat/
VITE_LIVEKIT_URL=https://rtc.catfla.re/
VITE_TURNSTILE_SITE_KEY=0x4AAAAAADyycnGvy_9SJcya'

write_dev_backup() {
  printf '%s\n' "$DEV_ENV" > .env.dev
}

write_prod_backup() {
  printf '%s\n' "$PROD_ENV" > .env.prod
}

if grep -q '^VITE_API_BASE_URL=http://127\.0\.0\.1:3000/' .env 2>/dev/null; then
  write_dev_backup
  write_prod_backup
  mv .env.prod .env
  echo "Switched to production .env"
else
  write_prod_backup
  write_dev_backup
  mv .env.dev .env
  echo "Switched to development .env"
fi
