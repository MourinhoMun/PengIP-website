#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/peng-ip-website}"
PM2_NAME="${PM2_NAME:-peng-ip-website-new}"
HEALTH_URL="${HEALTH_URL:-}"

cd "$APP_DIR"

echo "[deploy] dir=$APP_DIR pm2=$PM2_NAME"

if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] ERROR: node not found" >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] ERROR: pm2 not found" >&2
  exit 1
fi

# Keep secrets/data local; never touch .env or db files.

# Dependency install with a simple lockfile hash guard.
mkdir -p .deploy
lock_hash_file=.deploy/package-lock.sha256
lock_hash=""
if [ -f package-lock.json ]; then
  lock_hash=$(sha256sum package-lock.json | awk '{print $1}')
fi

need_install=0
if [ ! -d node_modules ]; then
  need_install=1
elif [ -n "$lock_hash" ]; then
  prev_hash=$(cat "$lock_hash_file" 2>/dev/null || true)
  if [ "$lock_hash" != "$prev_hash" ]; then
    need_install=1
  fi
fi

if [ "$need_install" = "1" ]; then
  echo "[deploy] npm ci"
  npm ci --production=false
  if [ -n "$lock_hash" ]; then
    echo "$lock_hash" >"$lock_hash_file"
  fi
else
  echo "[deploy] npm ci skipped (lock unchanged)"
fi

# Clean build output to avoid stale assets.
rm -rf .next

echo "[deploy] prisma generate (no migrate)"
# generate is safe; it doesn't touch DB.
if [ -f prisma/schema.prisma ]; then
  npx prisma generate
fi

echo "[deploy] npm run build"
npm run build

echo "[deploy] pm2 reload"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  # Fallback: attempt to start using npm start.
  pm2 start npm --name "$PM2_NAME" -- start
fi
pm2 save

if [ -n "$HEALTH_URL" ]; then
  echo "[deploy] healthcheck $HEALTH_URL"
  # Best-effort: 30s window.
  end=$((SECONDS+30))
  while [ $SECONDS -lt $end ]; do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      echo "[deploy] healthcheck OK"
      exit 0
    fi
    sleep 2
  done
  echo "[deploy] ERROR: healthcheck failed" >&2
  exit 1
fi

echo "[deploy] done"
