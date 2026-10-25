import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';
import {
	blockLines,
	countLines,
	isTestFile,
	limits,
	lineLimit,
	noEnums,
	noKeyboardTyping,
	noOuterMargin,
	noRealTimeWait,
	readAllowlist,
	repositoryRoot
} from './limits.js';

const packageDirectory = process.cwd();
const packagePrefix = `${toPosix(path.relative(repositoryRoot, packageDirectory))}/`;
const layoutIndex = process.argv.indexOf('--layout');
const layoutRoot = layoutIndex === -1 ? null : `${packagePrefix}${process.argv[layoutIndex + 1]}`;
const withStories = process.argv.includes('--stories');
const { parse } = createRequire(path.join(packageDirectory, 'package.json'))('svelte/compiler');
const TEXT_ATTRIBUTES = new Set(['aria-label', 'title', 'placeholder', 'alt']);
const LETTER = /\p{L}/u;
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

function isComponent(file) {
	return /\/src\/lib\/(.*\/)?([A-Z]\w*)\/\2\.svelte$/.test(file) && !file.includes('/testing/');
}

function checkCompanions(files) {
	const companions = [
		['component-test', '.svelte.spec.ts', 'test'],
		...(withStories ? [['component-story', '.stories.svelte', 'story']] : [])
	];
	const present = new Set(files);
	for (const [kind, suffix, label] of companions) {
		const allowed = new Set(existing(kind));
		for (const file of files.filter(isComponent)) {
			const companion = file.replace(/\.svelte$/, suffix);
			const has = present.has(companion);
			if (!has && !allowed.has(file)) {
				problems.push(
					`${file}: a component has its ${label} next to it, ${path.posix.basename(companion)}`
				);
			}
			if (has && allowed.has(file)) stale(kind, file, `it has its ${label}`);
		}
	}
}

function literalTexts(node) {
	if (!node || typeof node !== 'object') return [];
	if (Array.isArray(node)) return node.flatMap(literalTexts);
	if (node.type === 'Text') return LETTER.test(node.data) ? [node.data.trim()] : [];
	if (node.type === 'Attribute') {
		if (!TEXT_ATTRIBUTES.has(node.name) || !Array.isArray(node.value)) return [];
		return node.value
			.filter((part) => part.type === 'Text' && LETTER.test(part.data))
			.map((part) => `${node.name}="${part.data}"`);
	}
	if (node.type === 'StyleDirective') return [];
	return Object.entries(node).flatMap(([key, value]) =>
		key === 'parent' ? [] : literalTexts(value)
	);
}

function isUiTextChecked(file) {
	return (
		file.endsWith('.svelte') && !file.endsWith('.stories.svelte') && !file.includes('/testing/')
	);
}

function checkUiTexts(files) {
	const allowed = new Set(existing('ui-text'));
	for (const file of files.filter(isUiTextChecked)) {
		const texts = literalTexts(parse(read(file), { modern: true }).fragment);
		if (texts.length > 0 && !allowed.has(file)) {
			problems.push(
				`${file}: UI text comes from the dictionary m, not the markup: ${texts.join(', ')}`
			);
		}
		if (texts.length === 0 && allowed.has(file)) stale('ui-text', file, 'its markup holds no text');
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

async function checkListedMargins() {
	const config = {
		extends: ['stylelint-config-html/svelte'],
		rules: { 'declaration-property-value-allowed-list': { '/^margin/': [noOuterMargin] } }
	};
	for (const file of existing('margin')) {
		const { results } = await stylelint.lint({
			code: read(file),
			codeFilename: absolute(file),
			configBasedir: repositoryRoot,
			config
		});
		if (results[0].warnings.length === 0) stale('margin', file, 'it sets no outer margin');
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
checkCompanions(files);
checkUiTexts(files);
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
await checkListedRule(
	'test-keyboard',
	'no-restricted-properties',
	['error', noKeyboardTyping],
	'it no longer types with userEvent.keyboard'
);
await checkListedRule(
	'test-waiting',
	'no-restricted-syntax',
	['error', noEnums, noRealTimeWait],
	'it no longer waits real time'
);
await checkListedMargins();

if (problems.length > 0) {
	console.error(problems.join('\n'));
	console.error(`\n${problems.length} size, layout or comment problems`);
	process.exitCode = 1;
}
