import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { nodeEnv } from '../node-env/node-env.mjs';

const USAGE = `Usage:
  pnpm worktree <branch> [--from <ref>]   create a worktree for the branch next to the repository
  pnpm worktree remove <branch>           remove it, and delete the branch once its pull request is merged`;

function git(...args) {
	return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function succeeds(command, args) {
	return spawnSync(command, args, { stdio: 'ignore' }).status === 0;
}

function worktrees() {
	return git('worktree', 'list', '--porcelain')
		.split('\n\n')
		.map((block) => ({
			dir: /^worktree (.+)$/m.exec(block)?.[1],
			branch: /^branch refs\/heads\/(.+)$/m.exec(block)?.[1]
		}));
}

function folderFor(main, branch) {
	const issue = /atl-\d+/.exec(branch);
	const name = issue ? issue[0] : branch.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
	return path.join(path.dirname(main), `${path.basename(main)}-${name}`);
}

function add(main, branch, from) {
	const dir = folderFor(main, branch);
	if (existsSync(dir)) throw new Error(`${dir} already exists`);
	git('fetch', '--quiet', 'origin');
	if (succeeds('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`])) {
		git('worktree', 'add', '--quiet', dir, branch);
	} else if (
		succeeds('git', ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`])
	) {
		git('worktree', 'add', '--quiet', '--track', '-b', branch, dir, `origin/${branch}`);
	} else {
		git('worktree', 'add', '--quiet', '--no-track', '-b', branch, dir, from);
	}
	console.log(`Created ${dir} on ${branch}`);

	const env = path.join(main, 'apps', 'web', '.env');
	if (existsSync(env)) {
		copyFileSync(env, path.join(dir, 'apps', 'web', '.env'));
		console.log('Copied apps/web/.env');
	} else {
		console.log(`No ${env} to copy; the dev server and pnpm screenshot need one`);
	}

	const { env: nodeEnvironment, note } = nodeEnv(dir);
	console.log(`Installing dependencies on ${note}`);
	const install = spawnSync('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], {
		cwd: dir,
		env: nodeEnvironment,
		encoding: 'utf8'
	});
	if (install.status !== 0) {
		console.log(`${install.stdout}${install.stderr}`.trimEnd().split('\n').slice(-20).join('\n'));
		throw new Error('pnpm install failed');
	}
	console.log(`Ready: ${dir}`);
}

function remove(main, branch) {
	const worktree = worktrees().find((entry) => entry.branch === branch);
	if (!worktree) throw new Error(`No worktree is on ${branch}`);
	if (worktree.dir === main)
		throw new Error("The main checkout is the owner's and is never removed");
	git('worktree', 'remove', worktree.dir);
	console.log(`Removed ${worktree.dir}`);
	const merged = execFileSync(
		'gh',
		['pr', 'list', '--head', branch, '--state', 'merged', '--json', 'number', '--jq', 'length'],
		{ encoding: 'utf8' }
	).trim();
	if (merged !== '0') {
		git('branch', '-D', branch);
		console.log(`Deleted the merged branch ${branch}`);
	} else {
		console.log(`Kept the branch ${branch}: no merged pull request`);
	}
}

const args = process.argv.slice(2);
const fromIndex = args.indexOf('--from');
const from = fromIndex === -1 ? 'origin/develop' : args[fromIndex + 1];
const positional = args.filter(
	(arg, index) => !arg.startsWith('--') && (fromIndex === -1 || index !== fromIndex + 1)
);
const main = worktrees()[0].dir;

try {
	if (positional[0] === 'remove' && positional[1]) remove(main, positional[1]);
	else if (positional.length === 1 && positional[0] !== 'remove') add(main, positional[0], from);
	else throw new Error(USAGE);
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
