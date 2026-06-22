#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="${NODE_BIN:-$(command -v node)}"
PLIST_NAME="com.achyuth.jobagent"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
HOUR="${1:-8}"
MINUTE="${2:-0}"

mkdir -p "${PROJECT_DIR}/data"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PROJECT_DIR}/scripts/run-daily.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>${HOUR}</integer>
        <key>Minute</key>
        <integer>${MINUTE}</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>${PROJECT_DIR}/data/agent.log</string>
    <key>StandardErrorPath</key>
    <string>${PROJECT_DIR}/data/agent.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null || launchctl load "$PLIST_PATH"

echo "Installed daily job agent: $PLIST_PATH"
echo "Runs every day at ${HOUR}:$(printf '%02d' "${MINUTE}") local time."
echo "Logs: ${PROJECT_DIR}/data/agent.log"
echo ""
echo "Edit ${PROJECT_DIR}/.env then test with: npm run run"
