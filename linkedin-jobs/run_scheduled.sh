#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS="$DIR/schedule_settings.json"

# Read requireConfirmation from settings JSON
REQUIRE=$(python3 -c "
import json, sys
try:
    d = json.load(open('$SETTINGS'))
    print('yes' if d.get('requireConfirmation') else 'no')
except Exception:
    print('no')
" 2>/dev/null || echo "no")

if [ "$REQUIRE" = "yes" ]; then
  RESULT=$(osascript -e 'display dialog "Run LinkedIn Jobs Scraper now?" buttons {"Skip", "Run"} default button "Run" with title "Linkedationship" giving up after 30' 2>/dev/null || echo "skipped")
  if [[ "$RESULT" != *"button returned:Run"* ]]; then
    echo "$(date): Skipped by user." >> "$DIR/logs/scraper.log"
    exit 0
  fi
fi

cd "$DIR"

# Resolve API key: Keychain → settings file → already set in environment
if [ -z "$ANTHROPIC_API_KEY" ]; then
  ANTHROPIC_API_KEY=$(security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w 2>/dev/null || true)
fi
if [ -z "$ANTHROPIC_API_KEY" ]; then
  ANTHROPIC_API_KEY=$(python3 -c "import json; print(json.load(open('$SETTINGS')).get('apiKey',''))" 2>/dev/null || true)
fi
export ANTHROPIC_API_KEY

"$DIR/venv/bin/python3" linkedin_jobs.py
