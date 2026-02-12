#!/bin/bash
# Start both Bridge and Node-RED services
# Usage: ./scripts/start-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== ITP Booking Bot — Starting services ==="

# Start bridge in background
echo "[1/2] Starting Bridge service..."
cd "$ROOT_DIR/bridge"
if [ ! -d "node_modules" ]; then
  echo "  Installing bridge dependencies..."
  npm install
fi
node index.js &
BRIDGE_PID=$!
echo "  Bridge PID: $BRIDGE_PID"

# Start Node-RED
echo "[2/2] Starting Node-RED..."
cd "$ROOT_DIR/node-red"
if [ ! -d "node_modules" ]; then
  echo "  Installing Node-RED dependencies..."
  npm install
fi
npx node-red -s settings.js &
NODERED_PID=$!
echo "  Node-RED PID: $NODERED_PID"

echo ""
echo "=== Both services started ==="
echo "  Bridge:   http://localhost:3001"
echo "  Node-RED: http://localhost:1880"
echo ""
echo "Press Ctrl+C to stop both."

# Trap to kill both on exit
trap "kill $BRIDGE_PID $NODERED_PID 2>/dev/null; exit" INT TERM
wait
