#!/usr/bin/env bash
# OnlyFans Automation Manager
# File: reset_main.sh
# Purpose: Reset main branch on GitHub with current state
# Created: 2025-07-06 – v1.0

set -e

if [[ -z "${GITHUB_USER:-}" || -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_USER and GITHUB_TOKEN must be set" >&2
  exit 1
fi

REPO_URL="https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/carbidethegreate/obo2.git"

git init
git remote add origin "$REPO_URL"
git fetch origin
git checkout -B main

git add .
git commit -m "🔄 reset main to latest Codex state"
git push -f origin main

# End of File – Last modified 2025-07-06
