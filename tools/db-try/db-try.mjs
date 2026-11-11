import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = `Usage: pnpm db:try [options] [file.sql]   (or SQL on stdin, or -c "<sql>")
  --pending          run the migrations the local database has not run yet first
  --migration <file> run this migration first (repeatable)
  --test <file>      run this SQL test inside the transaction (repeatable)
  --all-tests        run every file of supabase/tests/
Everything runs in one transaction that is rolled back, so nothing stays in the database.`;

const TRANSACTION =
	/(?:^|;)\s*(begin|commit|end|abort|start\s+transaction|rollback(?!\s+to\b))\b/gi;

function withoutQuotedText(sql) {
	return sql
		.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, ' ')
		.replace(/'(?:[^']|'')*'/g, "''")
		.replace(/--[^\n]*/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

export function transactionStatements(sql) {
	return [...withoutQuotedText(sql).matchAll(TRANSACTION)].map((match) =>
		match[1].toLowerCase().replace(/\s+/g, ' ')
	);
}

export function unwrapTest(sql) {
	const begin = /^[ \t]*begin[ \t]*;[ \t]*$/im;
	if (!begin.test(sql)) return sql;
	const rollbacks = [...sql.matchAll(/^[ \t]*rollback[ \t]*;[ \t]*$/gim)];
	const last = rollbacks.at(-1);
	const withoutRollback = last
		? sql.slice(0, last.index) + sql.slice(last.index + last[0].length)
		: sql;
	return withoutRollback.replace(begin, '');
}

export function buildScript(parts) {
	for (const part of parts) {
		const found = transactionStatements(part.sql);
		if (found.length > 0) {
			throw new Error(
				`${part.label} contains "${found[0]}", which would end the transaction early; nothing ran`
			);
		}
	}
	const body = parts.map((part) =>
		part.isolated
			? `\\echo '-- ${part.label}'\nsavepoint db_try_part;\n${part.sql}\n;\nrollback to savepoint db_try_part;\nreset role;`
			: `\\echo '-- ${part.label}'\n${part.sql}\n;\nreset role;`
	);
	return ['\\set ON_ERROR_STOP on', 'begin;', ...body, 'rollback;', ''].join('\n');
}

function root() {
	return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

function container(repository) {
	const config = readFileSync(path.join(repository, 'supabase', 'config.toml'), 'utf8');
	return `supabase_db_${/^project_id\s*=\s*"([^"]+)"/m.exec(config)[1]}`;
}

function psql(name, args, input) {
	return spawnSync(
		'docker',
		['exec', '-i', name, 'psql', '-U', 'postgres', '-X', '-v', 'ON_ERROR_STOP=1', ...args],
		{ input, encoding: 'utf8' }
	);
}

function query(name, sql) {
	const result = psql(name, ['-tA', '-c', sql]);
	if (result.status !== 0) throw new Error(result.stderr.trim());
	return result.stdout.trim();
}

function pendingMigrations(repository, name) {
	const latest = query(
		name,
		"select coalesce(max(version), '0') from supabase_migrations.schema_migrations"
	);
	const folder = path.join(repository, 'supabase', 'migrations');
	return readdirSync(folder)
		.filter((file) => file.endsWith('.sql') && file.split('_')[0] > latest)
		.sort()
		.map((file) => path.join(folder, file));
}

function option(args, flag) {
	return args.flatMap((arg, index) => (arg === flag ? [args[index + 1]] : []));
}

function main() {
	const args = process.argv.slice(2);
	if (args.includes('--help')) {
		console.log(USAGE);
		return 0;
	}
	const repository = root();
	const name = container(repository);
	const valued = new Set(['--migration', '--test', '-c']);
	const files = args.filter((arg, index) => !arg.startsWith('-') && !valued.has(args[index - 1]));
	const tests = option(args, '--test').map((file) => path.resolve(file));
	if (args.includes('--all-tests')) {
		const folder = path.join(repository, 'supabase', 'tests');
		tests.push(
			...readdirSync(folder)
				.filter((file) => file.endsWith('.sql'))
				.sort()
				.map((file) => path.join(folder, file))
		);
	}
	const migrations = [
		...(args.includes('--pending') ? pendingMigrations(repository, name) : []),
		...option(args, '--migration').map((file) => path.resolve(file))
	];
	const label = (file) => path.relative(repository, file);
	const parts = [
		...migrations.map((file) => ({ label: label(file), sql: readFileSync(file, 'utf8') })),
		...tests.map((file) => ({
			label: label(file),
			sql: unwrapTest(readFileSync(file, 'utf8')),
			isolated: true
		})),
		...files.map((file) => ({ label: label(path.resolve(file)), sql: readFileSync(file, 'utf8') })),
		...option(args, '-c').map((sql) => ({ label: '-c', sql }))
	];
	if (parts.length === 0 && !process.stdin.isTTY)
		parts.push({ label: 'stdin', sql: readFileSync(0, 'utf8') });
	if (parts.length === 0) throw new Error(USAGE);

	const result = psql(name, ['-f', '-'], buildScript(parts));
	process.stdout.write(result.stdout);
	process.stderr.write(result.stderr);

	const users = query(name, "select count(*) from auth.users where email like '%@example.test'");
	const schemas = query(
		name,
		"select coalesce(string_agg(nspname, ', '), '') from pg_namespace where nspname like '%\\_test'"
	);
	if (users !== '0' || schemas !== '') {
		console.error(
			`Left in the database after the rollback: ${users} @example.test users; schemas: ${schemas || 'none'}. Tell the owner.`
		);
		return 3;
	}
	console.log(
		result.status === 0
			? 'Rolled back; nothing stayed in the database.'
			: 'Failed and rolled back; nothing stayed in the database.'
	);
	return result.status === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		process.exitCode = main();
	} catch (error) {
		console.error(error.message);
		process.exitCode = 2;
	}
}
