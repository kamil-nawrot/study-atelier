#!/usr/bin/env bash
set -euo pipefail

folder="$1"
target="$2"

age_version="v1.3.2"
age_sha256="cbe24006683f8eb669266162894b9a522a1af52f2665fbc63a4bb032ed26ac10"

if [ -z "${BACKUP_AGE_RECIPIENT:-}" ]; then
  echo "::error::BACKUP_AGE_RECIPIENT is not set for this environment, so no backup can be made."
  exit 1
fi

tools="$(mktemp -d)"
trap 'rm -rf "$tools"' EXIT
archive="$tools/age.tar.gz"
curl --fail --silent --show-error --location --retry 5 --retry-all-errors --output "$archive" \
  "https://github.com/FiloSottile/age/releases/download/$age_version/age-$age_version-linux-amd64.tar.gz"
echo "$age_sha256  $archive" | sha256sum --check --quiet
tar --directory "$tools" --extract --gzip --file "$archive" age/age
age="$tools/age/age"

tar --directory "$folder" --create --gzip --file - . | "$age" --recipient "$BACKUP_AGE_RECIPIENT" --output "$target"
echo "Encrypted backup: $(du -h "$target" | cut -f1)"
