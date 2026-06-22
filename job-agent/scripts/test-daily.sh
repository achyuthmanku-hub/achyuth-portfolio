#!/usr/bin/env bash
# Quick test of the daily runner (same script launchd uses at 8am)
cd "$(dirname "$0")/.." && ./scripts/run-daily.sh
