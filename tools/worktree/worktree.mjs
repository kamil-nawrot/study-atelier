import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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

export function folderFor(main, branch, taken = []) {
	const slug = (text) =>
		text
			.replace(/[^a-z0-9]+/gi, '-')
			.replace(/^-|-$/g, '')
			.toLowerCase();
	const issue = /atl-\d+/.exec(branch);
	const prefix = `${path.dirname(main)}${path.sep}${path.basename(main)}-`;
	const short = path.join(
		path.dirname(main),
		`${path.basename(main)}-${issue ? issue[0] : slug(branch)}`
	);
	const owner = taken.find((entry) => entry.dir === short);
	if (!issue || !owner || owner.branch === branch) return short;
	return `${prefix}${slug(branch.replace(/^(feature|bugfix)\//, ''))}`;
}

export function mergedBranchIsSafeToDelete(tip, mergedHeads, isAncestor) {
	return mergedHeads.some((head) => head === tip || isAncestor(tip, head));
}

function add(main, branch, from) {
	const dir = folderFor(main, branch, worktrees());
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
	const tip = git('rev-parse', `refs/heads/${branch}`);
	const merged = JSON.parse(
		execFileSync(
			'gh',
			['pr', 'list', '--head', branch, '--state', 'merged', '--json', 'headRefOid'],
			{ encoding: 'utf8' }
		)
	).map((pr) => pr.headRefOid);
	const isAncestor = (commit, head) =>
		succeeds('git', ['cat-file', '-e', `${head}^{commit}`]) &&
		succeeds('git', ['merge-base', '--is-ancestor', commit, head]);
	if (mergedBranchIsSafeToDelete(tip, merged, isAncestor)) {
		git('branch', '-D', branch);
		console.log(`Deleted the merged branch ${branch}`);
	} else if (merged.length > 0) {
		console.log(
			`Kept the branch ${branch}: it has commits that the merged pull request does not contain`
		);
	} else {
		console.log(`Kept the branch ${branch}: no merged pull request`);
	}
}

function run() {
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
