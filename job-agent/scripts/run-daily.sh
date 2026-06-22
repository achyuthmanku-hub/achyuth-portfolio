#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "[$(date -Iseconds)] Starting daily job agent run" >> data/agent.log

npm run run >> data/agent.log 2>> data/agent.error.log

echo "[$(date -Iseconds)] Finished daily job agent run" >> data/agent.log
