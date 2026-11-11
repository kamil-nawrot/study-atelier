import { execFileSync, spawnSync } from 'node:child_process';
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	readdirSync,
	rmSync
} from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const PACKAGES = [
	{ dir: 'apps/web', limits: ['--layout', 'src/lib'], dependencies: true },
	{ dir: 'packages/ui', limits: ['--stories'], dependencies: false }
];
const LINTED = /\.(ts|js|mjs|cjs|svelte)$/;
const STYLED = /\.(css|svelte)$/;
const TESTED = /^src\/.*\.(ts|js|svelte)$/;
const SPEC = /\.(spec|test)\.(ts|js)$/;
const ISSUE_BRANCH = /^(feature|bugfix)\/atl-(\d+)-/;

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const all = args.includes('--all');
const related = args.includes('--related');
const baseIndex = args.indexOf('--base');
const logDir = path.join(root, 'tmp', 'verify');

function git(...gitArgs) {
	return execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8' }).trim();
}

function lines(text) {
	return text.split('\n').filter(Boolean);
}

function nodeEnv() {
	const wanted = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim().split('.')[0];
	const current = process.versions.node.split('.')[0];
	if (wanted === current) return { env: process.env, note: `Node ${process.versions.node}` };
	const versions = path.join(homedir(), '.nvm', 'versions', 'node');
	const match = existsSync(versions)
		? readdirSync(versions)
				.filter((name) => name.startsWith(`v${wanted}.`))
				.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
				.at(-1)
		: undefined;
	if (!match) {
		return {
			env: process.env,
			note: `Node ${process.versions.node}; no Node ${wanted} in ~/.nvm, the dependency check may fail`
		};
	}
	const bin = path.join(versions, match, 'bin');
	return {
		env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` },
		note: `Node ${match.slice(1)} from ~/.nvm`
	};
}

function baseRef() {
	if (baseIndex !== -1) return args[baseIndex + 1];
	const upstream = ['origin/develop', 'develop'].find((ref) => {
		try {
			git('rev-parse', '--verify', '--quiet', ref);
			return true;
		} catch {
			return false;
		}
	});
	return git('merge-base', 'HEAD', upstream);
}

function changedFiles(base) {
	const files = new Set([
		...lines(git('diff', '--name-only', '--diff-filter=d', base)),
		...lines(git('ls-files', '--others', '--exclude-standard'))
	]);
	return [...files].filter((file) => existsSync(path.join(root, file))).sort();
}

function inPackage(files, dir) {
	return files
		.filter((file) => file.startsWith(`${dir}/`))
		.map((file) => file.slice(dir.length + 1));
}

function specsBeside(dir, files) {
	const folders = new Set(files.map((file) => path.posix.dirname(file)));
	return [...folders].flatMap((folder) =>
		readdirSync(path.join(root, dir, folder))
			.filter((name) => SPEC.test(name))
			.map((name) => path.posix.join(folder, name))
	);
}

function changedSteps(files) {
	const steps = [];
	if (files.length > 0) {
		steps.push({
			name: 'Prettier',
			cmd: 'pnpm',
			args: ['exec', 'prettier', '--check', '--ignore-unknown', ...files]
		});
	}
	for (const pkg of PACKAGES) {
		const own = inPackage(files, pkg.dir);
		if (own.length === 0) continue;
		const label = (name) => `${name} (${pkg.dir})`;
		const linted = own.filter((file) => LINTED.test(file));
		const styled = own.filter((file) => file.startsWith('src/') && STYLED.test(file));
		const tested = related
			? own.filter((file) => TESTED.test(file))
			: specsBeside(
					pkg.dir,
					own.filter((file) => TESTED.test(file))
				);
		if (linted.length > 0)
			steps.push({
				name: label('ESLint'),
				cwd: pkg.dir,
				cmd: 'pnpm',
				args: ['exec', 'eslint', ...linted]
			});
		if (styled.length > 0) {
			steps.push({
				name: label('Stylelint'),
				cwd: pkg.dir,
				cmd: 'pnpm',
				args: ['exec', 'stylelint', '--config', '../../stylelint.config.js', ...styled]
			});
		}
		steps.push(...packageChecks(pkg, label));
		if (tested.length > 0) {
			steps.push({
				name: label(related ? 'Vitest, related specs' : 'Vitest, specs beside the changes'),
				cwd: pkg.dir,
				cmd: 'pnpm',
				args: [
					'exec',
					'vitest',
					...(related ? ['related', '--run'] : ['run']),
					'--maxWorkers=2',
					...tested
				]
			});
		}
	}
	return steps;
}

function packageChecks(pkg, label) {
	const steps = [
		{
			name: label('Size limits and layout'),
			cwd: pkg.dir,
			cmd: 'node',
			args: ['../../lint/check-limits.js', ...pkg.limits]
		}
	];
	if (pkg.dependencies)
		steps.push({ name: label('Dependencies'), cwd: pkg.dir, cmd: 'pnpm', args: ['lint:deps'] });
	steps.push({ name: label('Type check'), cwd: pkg.dir, cmd: 'pnpm', args: ['check'] });
	return steps;
}

function allSteps() {
	const steps = [
		{
			name: 'Prettier (Markdown, lint/)',
			cmd: 'pnpm',
			args: ['exec', 'prettier', '--check', '**/*.md', 'lint/**']
		}
	];
	for (const pkg of PACKAGES) {
		const label = (name) => `${name} (${pkg.dir})`;
		steps.push({ name: label('Lint'), cwd: pkg.dir, cmd: 'pnpm', args: ['lint'] });
		steps.push({ name: label('Type check'), cwd: pkg.dir, cmd: 'pnpm', args: ['check'] });
		steps.push({
			name: label('Vitest'),
			cwd: pkg.dir,
			cmd: 'pnpm',
			args: ['exec', 'vitest', 'run', '--maxWorkers=2']
		});
	}
	return steps;
}

function repositorySteps(files, branch) {
	const steps = [];
	if (
		all ||
		files.some((file) => file.startsWith('.github/scripts/') || file.startsWith('.claude/hooks/'))
	) {
		steps.push({
			name: 'Workflow script and hook tests',
			cmd: 'node',
			args: ['--test', '.github/scripts/**/*.test.mjs', '.claude/hooks/*.test.mjs']
		});
	}
	if (all || files.some((file) => file.endsWith('.md'))) {
		steps.push({
			name: 'Docs links and ADR index',
			cmd: 'node',
			args: ['.github/scripts/check-docs.mjs']
		});
	}
	if (all || files.some((file) => file.startsWith('supabase/migrations/'))) {
		steps.push({
			name: 'Migration order',
			cmd: 'node',
			args: ['.github/scripts/check-migration-order.mjs'],
			env: { BASE_REF: 'develop' }
		});
	}
	const issue = ISSUE_BRANCH.exec(branch);
	if (issue) {
		steps.push({
			name: 'Branch name and commit subjects',
			cmd: 'node',
			args: ['.github/scripts/check-pull-request.mjs'],
			env: { PR_TITLE: `chore: ATL-${issue[2]} - verify`, HEAD_REF: branch, BASE_REF: 'develop' }
		});
	}
	return steps;
}

function slug(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function run(step, index, env) {
	const log = path.join(logDir, `${String(index + 1).padStart(2, '0')}-${slug(step.name)}.log`);
	const fd = openSync(log, 'w');
	const started = Date.now();
	if (process.stdout.isTTY) process.stdout.write(`… ${step.name}`);
	const result = spawnSync(step.cmd, step.args, {
		cwd: path.join(root, step.cwd ?? '.'),
		env: { ...env, ...step.env },
		stdio: ['ignore', fd, fd]
	});
	closeSync(fd);
	const seconds = ((Date.now() - started) / 1000).toFixed(0);
	const passed = result.status === 0;
	if (process.stdout.isTTY) process.stdout.write('\x1b[2K\r');
	console.log(`${passed ? '✓' : '✗'} ${step.name} (${seconds} s)`);
	return { ...step, passed, log, status: result.status ?? result.signal };
}

function tail(file, count) {
	return readFileSync(file, 'utf8').trimEnd().split('\n').slice(-count).join('\n');
}

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const base = all ? null : baseRef();
const files = all ? [] : changedFiles(base);
const steps = [...(all ? allSteps() : changedSteps(files)), ...repositorySteps(files, branch)];
const { env, note } = nodeEnv();

rmSync(logDir, { recursive: true, force: true });
mkdirSync(logDir, { recursive: true });

console.log(
	all
		? `Verifying everything on ${branch}, ${note}`
		: `Verifying ${files.length} changed files on ${branch} against ${base.slice(0, 8)}, ${note}`
);
const results = steps.map((step, index) => run(step, index, env));
const failed = results.filter((result) => !result.passed);

if (failed.length === 0) {
	console.log(`\nAll ${results.length} checks passed.`);
} else {
	for (const result of failed) {
		console.log(
			`\n✗ ${result.name} exited with ${result.status}. Log: ${path.relative(root, result.log)}\n${tail(result.log, 25)}`
		);
	}
	console.log(`\n${failed.length} of ${results.length} checks failed.`);
	process.exitCode = 1;
}
