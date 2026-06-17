#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
UI="$DIR/linkedin-jobs/electron-ui"

if [ ! -d "$UI/node_modules" ]; then
  echo "Installing dependencies..."
  npm install --prefix "$UI"
fi

# Start Vite renderer dev server in background
echo "Starting renderer dev server..."
"$UI/node_modules/.bin/vite" --config "$UI/vite.config.mjs" --port 5173 &
VITE_PID=$!

# Wait until Vite is ready (up to 30s)
for i in $(seq 1 30); do
  curl -s http://localhost:5173 > /dev/null 2>&1 && break
  sleep 1
done

# Launch Electron pointing at the Vite dev server
# Unset ELECTRON_RUN_AS_NODE — it's set by the Claude Code environment (which uses
# Electron in Node.js mode). Leaving it set causes Electron to skip its app
# initialization, so require('electron') never returns the API.
echo "Starting Electron..."
env -u ELECTRON_RUN_AS_NODE ELECTRON_RENDERER_URL=http://localhost:5173 "$UI/node_modules/.bin/electron" "$UI"

# Kill Vite when Electron exits
kill $VITE_PID 2>/dev/null
