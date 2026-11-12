import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const USAGE =
	'Usage: pnpm wait-ci <pull request number> [--check <extra job name>]... [--timeout <minutes>]';
const INTERVAL_MS = 30_000;
const FAILED = new Set(['fail', 'cancel']);

export function defaultChecks(files) {
	const isMarkdown = (file) => file.endsWith('.md');
	const checks = ['Conventions'];
	if (
		files.some(
			(file) => isMarkdown(file) || file === 'package.json' || file === 'prettier.config.js'
		)
	) {
		checks.push('Markdown');
	}
	const appCode = files.some(
		(file) =>
			!file.startsWith('docs/') && (!isMarkdown(file) || /^apps\/web\/src\/.*\.md$/.test(file))
	);
	if (appCode) checks.push('Web app');
	if (files.some((file) => file.startsWith('packages/ui/'))) checks.push('UI library');
	if (
		files.some(
			(file) =>
				file.startsWith('supabase/') || file === 'apps/web/src/lib/shared/data/database.types.ts'
		)
	) {
		checks.push('Migrations on local Supabase');
	}
	if (
		files.some((file) =>
			['apps/web/', 'packages/ui/', 'supabase/'].some((prefix) => file.startsWith(prefix))
		) ||
		files.includes('pnpm-lock.yaml')
	) {
		checks.push('End-to-end');
	}
	return checks;
}

export function summarise(checks, names) {
	const failedElsewhere = [
		...new Set(
			checks
				.filter((check) => FAILED.has(check.bucket) && !names.includes(check.name))
				.map((check) => check.name)
		)
	];
	const states = [...names, ...failedElsewhere].map((name) => {
		const buckets = checks.filter((check) => check.name === name).map((check) => check.bucket);
		if (buckets.some((bucket) => FAILED.has(bucket))) return { name, state: 'fail' };
		if (buckets.length === 0 || buckets.includes('pending')) return { name, state: 'pending' };
		if (buckets.includes('pass')) return { name, state: 'pass' };
		return { name, state: 'skipping' };
	});
	const overall = states.some(({ state }) => state === 'fail')
		? 'fail'
		: states.some(({ state }) => state === 'pending')
			? 'pending'
			: 'pass';
	return { overall, states };
}

export function parseArgs(args) {
	const checks = [];
	let minutes = 40;
	let pr = null;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--check') {
			const name = args[(index += 1)];
			if (!name || name.startsWith('--')) throw new Error(USAGE);
			checks.push(name);
		} else if (arg === '--timeout') {
			const value = args[(index += 1)];
			minutes = Number(value);
			if (!/^\d+(\.\d+)?$/.test(value ?? '') || !(minutes > 0)) {
				throw new Error(`--timeout takes a number of minutes, for example 40. ${USAGE}`);
			}
		} else if (/^\d+$/.test(arg) && pr === null) {
			pr = arg;
		} else {
			throw new Error(`Unknown argument "${arg}". ${USAGE}`);
		}
	}
	if (pr === null) throw new Error(USAGE);
	return { pr, checks, minutes };
}

function gh(args) {
	return JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
}

function checksOf(pr) {
	const result = spawnSync('gh', ['pr', 'checks', pr, '--json', 'name,bucket,link'], {
		encoding: 'utf8'
	});
	return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function localHead(branch) {
	const current = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
	if (current.status !== 0 || current.stdout.trim() !== branch) return null;
	return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

async function main() {
	const { pr, checks: named, minutes } = parseArgs(process.argv.slice(2));
	const view = gh(['pr', 'view', pr, '--json', 'files,headRefName']);
	const names = [...new Set([...defaultChecks(view.files.map((file) => file.path)), ...named])];
	console.log(`Waiting for ${names.join(', ')} on pull request #${pr}`);

	const deadline = Date.now() + minutes * 60_000;
	for (;;) {
		const pull = gh(['pr', 'view', pr, '--json', 'state,mergeable,headRefOid']);
		if (pull.state !== 'OPEN') {
			console.log(`The pull request is ${pull.state.toLowerCase()}`);
			return 2;
		}
		if (pull.mergeable === 'CONFLICTING') {
			console.log(
				'The pull request conflicts with its base branch, so CI does not run. Merge the base branch into it first.'
			);
			return 2;
		}
		const local = localHead(view.headRefName);
		const checks = local && local !== pull.headRefOid ? [] : checksOf(pr);
		const { overall, states } = summarise(checks, names);
		if (overall !== 'pending') {
			for (const { name, state } of states) {
				const links = checks.filter((check) => check.name === name).map((check) => check.link);
				console.log(`${state === 'fail' ? '✗' : '✓'} ${name}: ${state} ${links[0] ?? ''}`);
			}
			console.log(`Head commit ${pull.headRefOid}`);
			return overall === 'pass' ? 0 : 1;
		}
		if (Date.now() > deadline) {
			if (local && local !== pull.headRefOid) {
				console.log(
					`GitHub still shows ${pull.headRefOid} as the head, not the local ${local}: was it pushed?`
				);
			}
			console.log(
				`Still pending after ${minutes} minutes: ${states.map(({ name, state }) => `${name} ${state}`).join(', ')}`
			);
			return 2;
		}
		await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().then(
		(code) => {
			process.exitCode = code;
		},
		(error) => {
			console.error(error.message);
			process.exitCode = 2;
		}
	);
}
