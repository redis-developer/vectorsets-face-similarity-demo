#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/database/tmdb-gemini"

echo "Starting local Redis (dump source)…"
docker compose -f "$ROOT/docker-compose.yml" up -d redis

for i in $(seq 1 30); do
  if redis-cli PING 2>/dev/null | grep -q PONG; then
    if ! redis-cli VCARD vset:faces 2>/dev/null | grep -q LOADING; then
      break
    fi
  fi
  sleep 2
done

echo "Local VCARD: $(redis-cli VCARD vset:faces 2>/dev/null || echo '?')"
echo "Resuming import to REDIS_URL from $ROOT/.env"
echo "Log: $ROOT/database/tmdb-gemini/output/stream-import.log"
echo ""

# -i prevents idle sleep while seeding; run in Terminal.app (not IDE) for long jobs
exec caffeinate -i node 06-export-from-dump.js --resume 2>&1 | tee -a output/stream-import.log
