import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { findViolation } from './guard-bash.mjs';

const root = mkdtempSync(path.join(tmpdir(), 'guard-bash-'));
mkdirSync(path.join(root, 'supabase', 'snippets'), { recursive: true });
mkdirSync(path.join(root, 'apps', 'web'), { recursive: true });
writeFileSync(path.join(root, 'supabase', 'config.toml'), '');
mkdirSync(path.join(root, 'apps', 'web', '[number]'), { recursive: true });
writeFileSync(path.join(root, 'apps', 'web', '[number]', 'page.spec.ts'), '');

function blocked(command, cwd = root) {
	return findViolation(command, cwd) !== null;
}

test('blocks staging a whole folder or everything', () => {
	assert.ok(blocked('git add .'));
	assert.ok(blocked('git add -A'));
	assert.ok(blocked('git add --all'));
	assert.ok(blocked('git add supabase'));
	assert.ok(blocked('git add apps/'));
	assert.ok(blocked('git add supabase/config.toml supabase'));
	assert.ok(blocked('git add "apps/**/*.ts"'));
	assert.ok(blocked('git -C supabase add snippets'));
	assert.ok(blocked('cd supabase && git add snippets'));
	assert.ok(blocked('git status && git add . && git commit -m "x"'));
});

test('allows staging files by their paths', () => {
	assert.ok(!blocked('git add supabase/config.toml'));
	assert.ok(!blocked('git add -- supabase/config.toml new-file.ts'));
	assert.ok(!blocked('git add -u'));
	assert.ok(!blocked('cd supabase && git add config.toml'));
});

test('stages a file whose path has pattern characters, but not a pattern', () => {
	assert.ok(!blocked('git add "apps/web/[number]/page.spec.ts"'));
	assert.ok(!blocked('git add -- "apps/web/[number]/page.spec.ts"'));
	assert.ok(!blocked('git add ":(literal)apps/web/[number]/page.spec.ts"'));
	assert.ok(!blocked('cd apps/web && git add "[number]/page.spec.ts"'));
	assert.ok(blocked('git add "apps/web/[number]/*.ts"'));
	assert.ok(blocked('git add "apps/web/[number]"'));
	assert.ok(blocked('git add "apps/web/[number]/missing.ts"'));
	assert.ok(blocked('git add ":(glob)apps/**/page.spec.ts"'));
	assert.ok(blocked('git add ":!apps/web/[number]/page.spec.ts"'));
});

test('blocks a force push, a rebase and a pull with rebase', () => {
	assert.ok(blocked('git push --force'));
	assert.ok(blocked('git push --force-with-lease origin feature/atl-1-x'));
	assert.ok(blocked('git push -f'));
	assert.ok(blocked('git push -uf origin x'));
	assert.ok(blocked('git push origin +feature/atl-1-x'));
	assert.ok(blocked('git rebase develop'));
	assert.ok(blocked('git pull --rebase'));
	assert.ok(!blocked('git push -u origin feature/atl-1-x'));
	assert.ok(!blocked('git push --follow-tags'));
	assert.ok(!blocked('git pull'));
});

test('blocks a reset of the local database', () => {
	assert.ok(blocked('supabase db reset'));
	assert.ok(blocked('npx supabase db reset --local'));
	assert.ok(blocked('pnpm db:reset'));
	assert.ok(blocked('pnpm run db:reset'));
	assert.ok(!blocked('supabase migrations up'));
	assert.ok(!blocked('pnpm db:status'));
});

test('blocks a Claude-Session trailer in a commit or pull request', () => {
	assert.ok(blocked('git commit -m "feat: x\n\nClaude-Session: abc"'));
	assert.ok(blocked('gh pr create --body "Claude-Session: abc"'));
	assert.ok(!blocked('grep -r Claude-Session docs'));
});

test('blocks piping into jq', () => {
	assert.ok(blocked('gh pr list --json number | jq .'));
	assert.ok(!blocked('gh pr list --json number --jq ".[].number"'));
	assert.ok(!blocked('echo jq'));
});

test('ignores quoted text and heredoc bodies', () => {
	assert.ok(!blocked('git commit -m "docs: never run git add . here"'));
	assert.ok(!blocked("echo 'git push --force'"));
	assert.ok(
		!blocked("cat > notes.md <<'EOF'\ngit add .\nsupabase db reset\nEOF\ngit add notes.md")
	);
	assert.ok(blocked("cat > notes.md <<'EOF'\ntext\nEOF\ngit add ."));
});

test('the hook exits with 2 and a reason for a blocked command', () => {
	const script = fileURLToPath(new URL('./guard-bash.mjs', import.meta.url));
	const run = (command) =>
		spawnSync(process.execPath, [script], {
			input: JSON.stringify({ tool_input: { command }, cwd: root }),
			encoding: 'utf8'
		});
	const refused = run('git add .');
	assert.equal(refused.status, 2);
	assert.match(refused.stderr, /Stage each file by its path/);
	const allowed = run('git status');
	assert.equal(allowed.status, 0);
	assert.equal(allowed.stderr, '');
});
