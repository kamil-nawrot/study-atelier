#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

pnpm install

SUPABASE_URL="${SUPABASE_URL:-https://abcd.supabase.co}"
SUPABASE_PUBLISHABLE_KEY="${SUPABASE_PUBLISHABLE_KEY:-dummy}"

SOURCE_BROWSERS="${STUDY_ATELIER_SOURCE_BROWSERS:-/opt/pw-browsers}"
COMPAT_BROWSERS="${HOME}/.cache/study-atelier/pw-browsers"

expected_revision=$(
  cd apps/web && node -e "
    const { createRequire } = require('node:module');
    const path = require('node:path');
    const fs = require('node:fs');
    const fromPlaywright = createRequire(require.resolve('playwright'));
    const core = path.dirname(fromPlaywright.resolve('playwright-core/package.json'));
    const { browsers } = JSON.parse(fs.readFileSync(path.join(core, 'browsers.json'), 'utf8'));
    console.log(browsers.find((b) => b.name === 'chromium-headless-shell').revision);
  "
)

expected_dir="chromium_headless_shell-${expected_revision}"
available_dir=""
if [ -d "${SOURCE_BROWSERS}" ]; then
  available_dir=$(cd "${SOURCE_BROWSERS}" && ls -d chromium_headless_shell-* 2>/dev/null | sort -V | tail -n 1 || true)
fi

BROWSERS_PATH="${SOURCE_BROWSERS}"
if [ -n "${available_dir}" ] && [ "${available_dir}" != "${expected_dir}" ]; then
  source_shell="${SOURCE_BROWSERS}/${available_dir}/chrome-linux"
  target="${COMPAT_BROWSERS}/${expected_dir}/chrome-headless-shell-linux64"
  mkdir -p "${target}"
  for entry in "${source_shell}"/*; do
    ln -sfn "${entry}" "${target}/$(basename "${entry}")"
  done
  ln -sfn "${source_shell}/headless_shell" "${target}/chrome-headless-shell"
  touch "${COMPAT_BROWSERS}/${expected_dir}/INSTALLATION_COMPLETE"
  for other in "${SOURCE_BROWSERS}"/*; do
    case "$(basename "${other}")" in
      chromium_headless_shell-*) ;;
      *) ln -sfn "${other}" "${COMPAT_BROWSERS}/$(basename "${other}")" ;;
    esac
  done
  BROWSERS_PATH="${COMPAT_BROWSERS}"
fi

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export SUPABASE_URL='${SUPABASE_URL}'"
    echo "export SUPABASE_PUBLISHABLE_KEY='${SUPABASE_PUBLISHABLE_KEY}'"
    echo "export PLAYWRIGHT_BROWSERS_PATH='${BROWSERS_PATH}'"
    echo "export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"
  } >> "${CLAUDE_ENV_FILE}"
fi
