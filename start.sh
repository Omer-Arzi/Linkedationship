#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
UI="$DIR/linkedin-jobs/electron-ui"

if [ ! -d "$UI/node_modules" ]; then
  echo "Installing dependencies..."
  npm install --prefix "$UI"
fi

npm start --prefix "$UI"
