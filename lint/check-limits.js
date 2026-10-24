import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import {
	blockLines,
	countLines,
	isTestFile,
	limits,
	lineLimit,
	readAllowlist,
	repositoryRoot
} from './limits.js';

const packageDirectory = process.cwd();
const packagePrefix = `${toPosix(path.relative(repositoryRoot, packageDirectory))}/`;
const layoutIndex = process.argv.indexOf('--layout');
const layoutRoot = layoutIndex === -1 ? null : `${packagePrefix}${process.argv[layoutIndex + 1]}`;
const allowlist = readAllowlist();
const problems = [];

function toPosix(file) {
	return file.split(path.sep).join('/');
}

function absolute(file) {
	return path.join(repositoryRoot, file);
}

function read(file) {
	return readFileSync(absolute(file), 'utf8');
}

function listFiles(directory) {
	return readdirSync(absolute(directory), { withFileTypes: true }).flatMap((entry) => {
		const file = `${directory}/${entry.name}`;
		return entry.isDirectory() ? listFiles(file) : [file];
	});
}

function listed(kind) {
	return (allowlist[kind] ?? []).filter((file) => file.startsWith(packagePrefix));
}

function stale(kind, file, reason) {
	problems.push(
		`${file}: listed under "${kind}" in lint/allowlist.json, but ${reason}; remove the entry`
	);
}

function existing(kind) {
	return listed(kind).filter((file) => {
		if (existsSync(absolute(file))) return true;
		stale(kind, file, 'it no longer exists');
		return false;
	});
}

function checkSvelteBlocks(files) {
	for (const kind of ['script', 'style']) {
		const allowed = new Set(existing(kind));
		for (const file of files.filter((candidate) => candidate.endsWith('.svelte'))) {
			const lines = blockLines(read(file), kind);
			if (lines > limits[kind] && !allowed.has(file)) {
				problems.push(`${file}: the ${kind} block has ${lines} lines, more than ${limits[kind]}`);
			}
			if (lines <= limits[kind] && allowed.has(file)) {
				stale(kind, file, `its ${kind} block has ${lines} lines, within ${limits[kind]}`);
			}
		}
	}
}

function checkListedLines() {
	for (const file of existing('lines')) {
		const lines = countLines(read(file));
		if (lines <= lineLimit(file)) {
			stale('lines', file, `it has ${lines} lines, within ${lineLimit(file)}`);
		}
	}
}

async function checkListedComplexity() {
	const files = existing('complexity');
	if (files.length === 0) return;
	const eslint = new ESLint({
		cwd: packageDirectory,
		overrideConfig: { rules: { complexity: ['error', limits.complexity] } }
	});
	const results = await eslint.lintFiles(files.map(absolute));
	for (const result of results) {
		if (!result.messages.some((message) => message.ruleId === 'complexity')) {
			const file = toPosix(path.relative(repositoryRoot, result.filePath));
			stale('complexity', file, `no function is more complex than ${limits.complexity}`);
		}
	}
}

function checkListedSupabase() {
	for (const file of existing('supabase')) {
		if (!/from\s+['"][^'"]*\/supabase\.ts['"]/.test(read(file))) {
			stale('supabase', file, 'it no longer imports the Supabase client');
		}
	}
}

function baseName(file) {
	return path.posix
		.basename(file)
		.replace(/\.(spec|test)\.ts$/, '')
		.replace(/\.ts$/, '')
		.replace(/\.svelte$/, '');
}

function typeName(file) {
	return baseName(file)
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

function typeFileProblem(file) {
	const exports = [...read(file).matchAll(/^export\s+(?:declare\s+)?(\w+)\s+(\w+)/gm)];
	const [only] = exports;
	if (exports.length !== 1 || !['type', 'interface'].includes(only[1])) {
		return 'a file in types/ exports exactly one type';
	}
	if (only[2] !== typeName(file)) {
		return `a file in types/ exports the type named like the file, ${typeName(file)}`;
	}
	return null;
}

function layoutProblem(file) {
	const name = path.posix.basename(file);
	const folder = path.posix.basename(path.posix.dirname(file));
	if (name === 'index.ts') return 'there are no index.ts files';
	if (folder === 'types' && !isTestFile(file)) return typeFileProblem(file);
	if (folder !== baseName(file)) return `the file sits in a folder named ${baseName(file)}`;
	return null;
}

function isLayoutChecked(file) {
	if (!/\.(ts|svelte)$/.test(file) || file.endsWith('.d.ts')) return false;
	return !/(^|\/)(database\.types\.ts|i18n\/pl\.ts)$/.test(file);
}

function checkLayout(files) {
	const allowed = new Set(listed('layout'));
	const violatingFolders = new Set();
	for (const file of files.filter((candidate) => candidate.startsWith(`${layoutRoot}/`))) {
		const problem = isLayoutChecked(file) ? layoutProblem(file) : null;
		if (!problem) continue;
		const folder = path.posix.dirname(file);
		violatingFolders.add(folder);
		if (!allowed.has(folder)) problems.push(`${file}: ${problem}`);
	}
	for (const folder of allowed) {
		if (!violatingFolders.has(folder))
			stale('layout', folder, 'every file in it follows the layout');
	}
}

const files = listFiles(`${packagePrefix}src`);
checkSvelteBlocks(files);
checkListedLines();
checkListedSupabase();
if (layoutRoot) checkLayout(files);
await checkListedComplexity();

if (problems.length > 0) {
	console.error(problems.join('\n'));
	console.error(`\n${problems.length} size or layout problems`);
	process.exitCode = 1;
}
