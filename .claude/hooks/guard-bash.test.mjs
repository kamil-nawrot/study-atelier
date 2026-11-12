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

test('blocks every spelling of a staging of everything', () => {
	assert.ok(blocked('git add -vA'));
	assert.ok(blocked('git add -Av'));
	assert.ok(blocked('git add --al'));
	assert.ok(blocked('git add --no-ignore-rem'));
	assert.ok(!blocked('git add -v supabase/config.toml'));
	assert.ok(!blocked('git add --verbose supabase/config.toml'));
});

test('blocks deleting a remote branch, mirroring and cleaning untracked files', () => {
	assert.ok(blocked('git push origin :develop'));
	assert.ok(blocked('git push origin --delete feature/atl-1-x'));
	assert.ok(blocked('git push origin -d feature/atl-1-x'));
	assert.ok(blocked('git push --mirror'));
	assert.ok(blocked('git clean -fdx'));
	assert.ok(blocked('git clean -f'));
	assert.ok(!blocked('git clean -n'));
	assert.ok(!blocked('git clean --dry-run -d'));
	assert.ok(!blocked('git push origin HEAD:feature/atl-1-x'));
});

test('lets a rebase be left, and a pull without a rebase through', () => {
	assert.ok(!blocked('git rebase --abort'));
	assert.ok(!blocked('git rebase --quit'));
	assert.ok(blocked('git rebase --continue'));
	assert.ok(!blocked('git pull --rebase=false'));
	assert.ok(blocked('git pull --rebase=true'));
	assert.ok(blocked('git pull --rebase=merges'));
});

test('sees through bash -c and sudo', () => {
	assert.ok(blocked('bash -c "git add ."'));
	assert.ok(blocked("sh -lc 'git push --force'"));
	assert.ok(blocked('sudo git add -A'));
	assert.ok(blocked('sudo -u root git rebase develop'));
	assert.ok(blocked('env FOO=1 pnpm db:reset'));
	assert.ok(blocked('bash -c "bash -c \'git clean -fdx\'"'));
	assert.ok(!blocked('bash -c "git status"'));
	assert.ok(!blocked('sudo ls'));
});

test('blocks a reset of the local database', () => {
	assert.ok(blocked('supabase db reset'));
	assert.ok(blocked('npx supabase db reset --local'));
	assert.ok(blocked('pnpm db:reset'));
	assert.ok(blocked('pnpm run db:reset'));
	assert.ok(blocked('pnpm exec supabase db reset'));
	assert.ok(blocked('pnpm supabase db reset --local'));
	assert.ok(blocked('pnpm dlx supabase db reset'));
	assert.ok(blocked('supabase stop --no-backup'));
	assert.ok(blocked('pnpm exec supabase stop --no-backup'));
	assert.ok(!blocked('supabase stop'));
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
