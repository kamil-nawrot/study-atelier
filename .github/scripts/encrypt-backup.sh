#!/usr/bin/env bash
set -euo pipefail

folder="$1"
target="$2"

if [ -z "${BACKUP_AGE_RECIPIENT:-}" ]; then
  echo "::error::BACKUP_AGE_RECIPIENT is not set for this environment, so no backup can be made."
  exit 1
fi

if ! command -v age > /dev/null; then
  sudo apt-get update --quiet > /dev/null
  sudo apt-get install --yes --quiet age > /dev/null
fi

tar --directory "$folder" --create --gzip --file - . | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$target"
echo "Encrypted backup: $(du -h "$target" | cut -f1)"
