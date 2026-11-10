#!/bin/bash
cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "Drift Hall needs Node.js, one time."
  echo
  echo "1. Open https://nodejs.org"
  echo "2. Download the LTS installer and run it. The usual choices are fine."
  echo "3. Double-click this file again."
  echo
  echo "If a Mac says it cannot open this file, right-click it, choose Open, then Open."
  echo
  read -r -p "Press Enter to close."
  exit 1
fi
exec node scripts/start-local.mjs "$@"
