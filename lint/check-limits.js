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

function isRoutePage(file) {
	return /\/src\/routes\/(.*\/)?\+(page|layout)\.svelte$/.test(file);
}

function checkRouteScripts(files) {
	const allowed = new Set(existing('route-script'));
	for (const file of files.filter(isRoutePage)) {
		const lines = blockLines(read(file), 'script');
		if (lines > limits.routeScript && !allowed.has(file)) {
			problems.push(
				`${file}: the page script has ${lines} lines, more than ${limits.routeScript}; move its logic into a view component of its module`
			);
		}
		if (lines <= limits.routeScript && allowed.has(file)) {
			stale('route-script', file, `its script has ${lines} lines, within ${limits.routeScript}`);
		}
	}
}

function markup(source) {
	return source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '');
}

function checkMarkupComments(files) {
	for (const file of files.filter((candidate) => candidate.endsWith('.svelte'))) {
		for (const comment of markup(read(file)).matchAll(/<!--([\s\S]*?)-->/g)) {
			if (/^\s*(svelte-ignore|prettier-ignore)\b/.test(comment[1])) continue;
			problems.push(`${file}: no comments in markup, only svelte-ignore directives`);
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

async function checkListedRule(kind, ruleId, setting, reason) {
	const files = existing(kind);
	if (files.length === 0) return;
	const eslint = new ESLint({
		cwd: packageDirectory,
		overrideConfig: { rules: { [ruleId]: setting } }
	});
	const results = await eslint.lintFiles(files.map(absolute));
	for (const result of results) {
		if (!result.messages.some((message) => message.ruleId === ruleId)) {
			stale(kind, toPosix(path.relative(repositoryRoot, result.filePath)), reason);
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
checkRouteScripts(files);
checkMarkupComments(files);
checkListedLines();
if (layoutRoot) checkLayout(files);
await checkListedRule(
	'complexity',
	'complexity',
	['error', limits.complexity],
	`no function is more complex than ${limits.complexity}`
);
await checkListedRule(
	'storage',
	'no-restricted-globals',
	['error', 'localStorage', 'sessionStorage'],
	'it no longer uses localStorage or sessionStorage directly'
);

if (problems.length > 0) {
	console.error(problems.join('\n'));
	console.error(`\n${problems.length} size, layout or comment problems`);
	process.exitCode = 1;
}
