#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container="${SUPABASE_DB_CONTAINER:-supabase_db_study-atelier}"
applied=$(docker exec -i "$container" psql -U postgres -At -c "select coalesce(max(version), '0') from supabase_migrations.schema_migrations")

{
  echo 'begin;'
  for file in migrations/*.sql; do
    version=$(basename "$file" | cut -d_ -f1)
    if [[ "$version" > "$applied" ]]; then
      cat "$file"
      echo
    fi
  done
  for file in "$@"; do
    cat "$file"
    echo
  done
  cat scale/seed.sql scale/measure.sql
  echo 'rollback;'
} | docker exec -i "$container" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q
