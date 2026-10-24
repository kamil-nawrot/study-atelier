import { readFileSync } from 'node:fs';
import path from 'node:path';

export const repositoryRoot = path.resolve(import.meta.dirname, '..');

export const limits = {
	ts: 300,
	svelte: 400,
	test: 800,
	script: 200,
	style: 150,
	complexity: 15
};

export const exemptFromLines = ['**/database.types.ts', '**/i18n/pl.ts', '**/countries.ts'];

export const testFiles = ['**/*.spec.ts', '**/*.test.ts'];

export const allowlistPath = path.join(repositoryRoot, 'lint', 'allowlist.json');

export function readAllowlist() {
	return JSON.parse(readFileSync(allowlistPath, 'utf8'));
}

export function allowlisted(kind, rules) {
	const files = readAllowlist()[kind] ?? [];
	return files.length === 0 ? [] : [{ basePath: repositoryRoot, files, rules }];
}

export function countLines(text) {
	return text.split(/\r?\n/).filter((line) => line.trim() !== '').length;
}

export function blockLines(source, tag) {
	const blocks = source.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g'));
	return [...blocks].reduce((total, block) => total + countLines(block[1]), 0);
}

export function isTestFile(file) {
	return /\.(spec|test)\.ts$/.test(file);
}

export function lineLimit(file) {
	if (isTestFile(file)) return limits.test;
	return file.endsWith('.svelte') ? limits.svelte : limits.ts;
}
