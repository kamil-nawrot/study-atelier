import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEPARATORS = new Set(['&&', '||', ';', '|', '&', '\n', '(', ')']);
const GLOB = /[*?[]/;

function stripHeredocs(command) {
	const lines = command.split('\n');
	const kept = [];
	let delimiter = null;
	for (const line of lines) {
		if (delimiter !== null) {
			if (line.trim() === delimiter) delimiter = null;
			continue;
		}
		kept.push(line);
		const opened = /<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/.exec(line);
		if (opened) delimiter = opened[2];
	}
	return kept.join('\n');
}

function tokenize(command) {
	const tokens = [];
	let current = '';
	let started = false;
	let quote = null;
	const push = () => {
		if (started) tokens.push({ word: current });
		current = '';
		started = false;
	};
	for (let index = 0; index < command.length; index += 1) {
		const char = command[index];
		if (quote) {
			if (char === quote) quote = null;
			else if (char === '\\' && quote === '"' && index + 1 < command.length) {
				index += 1;
				current += command[index];
			} else current += char;
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			started = true;
		} else if (char === '\\' && index + 1 < command.length) {
			index += 1;
			if (command[index] !== '\n') {
				current += command[index];
				started = true;
			}
		} else if (char === ' ' || char === '\t') {
			push();
		} else {
			const pair = command.slice(index, index + 2);
			if (pair === '&&' || pair === '||') {
				push();
				tokens.push({ separator: pair });
				index += 1;
			} else if (SEPARATORS.has(char)) {
				push();
				tokens.push({ separator: char });
			} else {
				current += char;
				started = true;
			}
		}
	}
	push();
	return tokens;
}

function segments(command) {
	const result = [];
	let words = [];
	let afterPipe = false;
	for (const token of tokenize(stripHeredocs(command))) {
		if (token.separator) {
			if (words.length > 0) result.push({ words, afterPipe });
			words = [];
			afterPipe = token.separator === '|';
		} else {
			words.push(token.word);
		}
	}
	if (words.length > 0) result.push({ words, afterPipe });
	return result;
}

function withoutAssignments(words) {
	let start = 0;
	while (start < words.length && /^[A-Za-z_]\w*=/.test(words[start])) start += 1;
	return words.slice(start);
}

function gitCall(words, cwd) {
	if (words[0] !== 'git') return null;
	let directory = cwd;
	let index = 1;
	while (index < words.length && words[index].startsWith('-')) {
		if (words[index] === '-C') {
			directory = path.resolve(directory, words[index + 1] ?? '.');
			index += 2;
		} else if (words[index] === '-c') {
			index += 2;
		} else {
			index += 1;
		}
	}
	return { subcommand: words[index], args: words.slice(index + 1), directory };
}

function isDirectory(file) {
	try {
		return statSync(file).isDirectory();
	} catch {
		return false;
	}
}

function isFile(file) {
	try {
		return statSync(file).isFile();
	} catch {
		return false;
	}
}

function namesOneFile(arg, directory) {
	const literal = arg.startsWith(':(literal)') ? arg.slice(':(literal)'.length) : arg;
	if (literal.startsWith(':')) return false;
	return isFile(path.resolve(directory, literal));
}

function checkAdd(args, directory) {
	for (const arg of args) {
		if (arg === '--') continue;
		if (arg === '-A' || arg === '--all' || arg === '--no-ignore-removal') {
			return "git add -A stages everything, the owner's untracked files too. Stage each file by its path.";
		}
		if (arg.startsWith('-')) continue;
		if (arg === '.' || arg.endsWith('/') || isDirectory(path.resolve(directory, arg))) {
			return `git add ${arg} stages a whole folder, the owner's untracked files in it too (for example supabase/snippets/). Stage each file by its path.`;
		}
		if ((GLOB.test(arg) || arg.startsWith(':')) && !namesOneFile(arg, directory)) {
			return `git add ${arg} stages by a pattern. Stage each file by its path.`;
		}
	}
	return null;
}

function checkPush(args) {
	const forced = args.some(
		(arg) =>
			arg === '-f' ||
			arg.startsWith('--force') ||
			(/^-[a-zA-Z]+$/.test(arg) && arg.includes('f')) ||
			/^\+./.test(arg)
	);
	return forced ? 'A pushed branch is never force-pushed. Merge develop into it instead.' : null;
}

function checkGit(call) {
	if (call.subcommand === 'add') return checkAdd(call.args, call.directory);
	if (call.subcommand === 'push') return checkPush(call.args);
	if (call.subcommand === 'rebase') {
		return 'A branch is never rebased. Merge develop into it instead.';
	}
	if (
		call.subcommand === 'pull' &&
		call.args.some((arg) => arg.startsWith('--rebase') || arg === '-r')
	) {
		return 'A branch is never rebased. Pull with a merge instead.';
	}
	return null;
}

function checkDatabaseReset(words) {
	const script =
		words[0] === 'pnpm' || words[0] === 'npm'
			? words.slice(1).filter((word) => word !== 'run')
			: [];
	const supabase = words[0] === 'npx' || words[0] === 'pnpx' ? words.slice(1) : words;
	if (
		script[0] === 'db:reset' ||
		(supabase[0] === 'supabase' && supabase[1] === 'db' && supabase[2] === 'reset')
	) {
		return 'A database reset wipes the owner\'s local Supabase. Ask the owner to run "supabase migrations up" instead, and try SQL only in a rolled-back transaction.';
	}
	return null;
}

export function findViolation(command, cwd = process.cwd()) {
	let directory = cwd;
	const parts = segments(command);
	if (
		command.includes('Claude-Session') &&
		parts.some(({ words }) => ['git', 'gh'].includes(withoutAssignments(words)[0]))
	) {
		return 'Commits and pull requests carry no Claude-Session trailer.';
	}
	for (const part of parts) {
		const words = withoutAssignments(part.words);
		if (words.length === 0) continue;
		if (words[0] === 'cd' && words[1]) {
			directory = path.resolve(directory, words[1]);
			continue;
		}
		if (part.afterPipe && words[0] === 'jq') {
			return 'The host has no jq. Filter gh output with --jq, or parse JSON with node -e.';
		}
		const call = gitCall(words, directory);
		const problem = call ? checkGit(call) : checkDatabaseReset(words);
		if (problem) return problem;
	}
	return null;
}

function main() {
	const input = JSON.parse(readFileSync(0, 'utf8'));
	const command = input.tool_input?.command;
	if (typeof command !== 'string') return;
	const problem = findViolation(command, input.cwd);
	if (problem) {
		process.stderr.write(`Blocked by .claude/hooks/guard-bash.mjs: ${problem}\n`);
		process.exitCode = 2;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
