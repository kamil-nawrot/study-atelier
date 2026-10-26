#!/usr/bin/env bash
set -euo pipefail

out="$1"
mkdir -p "$out"

project_ref=$(echo "$SUPABASE_URL" | sed -E 's#^https://([^.]+)\.supabase\.co.*$#\1#')
supabase link --project-ref "$project_ref"

supabase db dump --linked --role-only --file "$out/roles.sql"
supabase db dump --linked --file "$out/schema.sql"
supabase db dump --linked --data-only --use-copy \
  --exclude storage.buckets_vectors,storage.vector_indexes --file "$out/data.sql"
supabase db dump --linked --schema supabase_migrations --file "$out/history-schema.sql"
supabase db dump --linked --data-only --use-copy --schema supabase_migrations --file "$out/history-data.sql"
