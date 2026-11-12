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

function stagesAll(arg) {
	if (/^-[a-zA-Z]+$/.test(arg)) return arg.includes('A');
	if (!arg.startsWith('--')) return false;
	return (
		(arg.length >= 4 && '--all'.startsWith(arg)) ||
		(arg.length >= 5 && '--no-ignore-removal'.startsWith(arg))
	);
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
		if (stagesAll(arg)) {
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
	if (forced) return 'A pushed branch is never force-pushed. Merge develop into it instead.';
	const deleting = args.some(
		(arg) =>
			arg === '--mirror' ||
			arg === '--prune' ||
			(arg.length >= 4 && '--delete'.startsWith(arg)) ||
			(/^-[a-zA-Z]+$/.test(arg) && arg.includes('d')) ||
			/^:./.test(arg)
	);
	return deleting
		? 'A push never deletes a remote branch or mirrors refs. The owner deletes branches.'
		: null;
}

function checkClean(args) {
	const dry = args.some(
		(arg) => arg === '--dry-run' || (/^-[a-zA-Z]+$/.test(arg) && arg.includes('n'))
	);
	return dry
		? null
		: "git clean deletes untracked files, the owner's design/ and supabase/snippets/ among them. Use git clean -n to look, and remove a file by its path.";
}

function rebases(arg) {
	if (arg === '-r') return true;
	if (!arg.startsWith('--rebase')) return false;
	return !/^--rebase=(false|no|0|off)$/.test(arg);
}

function checkGit(call) {
	if (call.subcommand === 'add') return checkAdd(call.args, call.directory);
	if (call.subcommand === 'push') return checkPush(call.args);
	if (call.subcommand === 'clean') return checkClean(call.args);
	if (call.subcommand === 'rebase') {
		const leaving = call.args.some((arg) => arg === '--abort' || arg === '--quit');
		return leaving ? null : 'A branch is never rebased. Merge develop into it instead.';
	}
	if (call.subcommand === 'pull' && call.args.some(rebases)) {
		return 'A branch is never rebased. Pull with a merge instead.';
	}
	return null;
}

const RUNNERS = new Set(['pnpm', 'npm', 'npx', 'pnpx', 'yarn', 'bunx', 'bun']);
const RUNNER_WORDS = new Set(['run', 'exec', 'dlx', 'x']);
const WRAPPERS = new Set([
	'sudo',
	'doas',
	'env',
	'command',
	'exec',
	'nohup',
	'time',
	'nice',
	'xargs'
]);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);

function checkDatabaseReset(words) {
	const rest = RUNNERS.has(words[0])
		? words.slice(1).filter((word) => !RUNNER_WORDS.has(word) && !word.startsWith('-'))
		: words;
	const script = RUNNERS.has(words[0]) ? rest : [];
	const supabase = rest[0] === 'supabase' ? rest : [];
	if (
		script[0] === 'db:reset' ||
		(supabase[1] === 'db' && supabase[2] === 'reset') ||
		(supabase[1] === 'stop' && words.some((word) => word === '--no-backup'))
	) {
		return 'A database reset or a stop without backup wipes the owner\'s local Supabase. Ask the owner to run "supabase migrations up" instead, and try SQL only in a rolled-back transaction.';
	}
	return null;
}

const VALUE_FLAGS = new Set(['-u', '-g', '-h', '-p', '-C', '-U', '-n', '-P', '-S']);

function unwrap(words) {
	if (WRAPPERS.has(words[0])) {
		let index = 1;
		while (index < words.length) {
			if (words[index].startsWith('-')) {
				index += VALUE_FLAGS.has(words[index]) && words[0] !== 'xargs' ? 2 : 1;
			} else if (/^[A-Za-z_]\w*=/.test(words[index])) {
				index += 1;
			} else break;
		}
		return index < words.length ? { words: words.slice(index) } : null;
	}
	if (SHELLS.has(words[0])) {
		const flag = words.findIndex((word) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(word));
		if (flag !== -1 && words[flag + 1]) return { command: words[flag + 1] };
	}
	return null;
}

function checkWords(input, directory, afterPipe, depth) {
	const words = withoutAssignments(input);
	if (words.length === 0) return null;
	if (afterPipe && words[0] === 'jq') {
		return 'The host has no jq. Filter gh output with --jq, or parse JSON with node -e.';
	}
	const call = gitCall(words, directory);
	const problem = call ? checkGit(call) : checkDatabaseReset(words);
	if (problem || depth >= 4) return problem;
	const inner = unwrap(words);
	if (inner?.words) return checkWords(inner.words, directory, false, depth + 1);
	if (inner?.command) return findViolation(inner.command, directory, depth + 1);
	return null;
}

export function findViolation(command, cwd = process.cwd(), depth = 0) {
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
		if (words[0] === 'cd' && words[1]) {
			directory = path.resolve(directory, words[1]);
			continue;
		}
		const problem = checkWords(part.words, directory, part.afterPipe, depth);
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
