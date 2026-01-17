#!/usr/bin/env bash
set -euo pipefail

missing=0

check_env() {
  local file="$1"
  local key="$2"
  if ! grep -q "^${key}=" "$file"; then
    echo "Missing $key in $file"
    missing=1
    return
  fi
  local value
  value=$(grep "^${key}=" "$file" | cut -d'=' -f2-)
  if [[ -z "$value" ]]; then
    echo "Empty $key in $file"
    missing=1
  fi
}

check_env apps/api/.env API_AUTH_SECRET
check_env apps/api/.env WORKER_SHARED_SECRET
check_env apps/api/.env SIGNALS_HMAC_SECRET
check_env apps/api/.env RETOOL_AGENT_WEBHOOK_URL
check_env apps/api/.env RETOOL_AGENT_API_KEY

check_env apps/worker/.env WORKER_SHARED_SECRET
check_env apps/worker/.env GITHUB_TOKEN
check_env apps/worker/.env VERCEL_TOKEN
check_env apps/worker/.env ANTHROPIC_API_KEY

if [[ "$missing" -ne 0 ]]; then
  echo "Env check failed. Fill missing values and re-run."
  exit 1
fi

echo "Env check passed. Run service pings manually:"

echo "- API health: curl http://localhost:3001/health"

echo "- Worker health: curl http://localhost:3002/health"
