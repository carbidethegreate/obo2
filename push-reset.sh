#!/usr/bin/env bash
# OnlyFans Automation Manager
# File: push-reset.sh
# Purpose: Force push local repo state to a remote
# Created: 2025-07-06 – v1.0
# Usage: ./push-reset.sh <remote_git_url>

set -euo pipefail

REMOTE_URL="${1:-}"

if [[ -z "$REMOTE_URL" ]]; then
  echo "Usage: $0 <remote_git_url>"
  exit 1
fi

# Configure the remote named 'origin'
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# Make sure we're on main (create it if needed)
git checkout -B main

# Force-push the current repository state to origin/main
git push --force origin main

# End of File – Last modified 2025-07-06
