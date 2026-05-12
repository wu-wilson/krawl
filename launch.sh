#!/usr/bin/env bash
# Launches both the Krawl server and client for local development.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  wait $SERVER_PID $CLIENT_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Install dependencies if needed
if [ ! -d "$ROOT_DIR/server/node_modules" ]; then
  echo "Installing server dependencies..."
  (cd "$ROOT_DIR/server" && npm install)
fi

if [ ! -d "$ROOT_DIR/client/node_modules" ]; then
  echo "Installing client dependencies..."
  (cd "$ROOT_DIR/client" && npm install)
fi

# Start server
echo "Starting proxy server on port ${PORT:-3001}..."
(cd "$ROOT_DIR/server" && npm run dev) &
SERVER_PID=$!

# Brief pause to let the server start
sleep 1

# Start client
echo "Starting client on http://localhost:5173..."
(cd "$ROOT_DIR/client" && npm run dev) &
CLIENT_PID=$!

wait
