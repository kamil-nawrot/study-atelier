import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { defaultChecks, parseArgs, summarise } from './wait-ci.mjs';

test('picks the checks from the changed files', () => {
	assert.deepEqual(defaultChecks(['docs/a.md', 'CLAUDE.md']), ['Conventions', 'Markdown']);
	assert.deepEqual(defaultChecks(['apps/web/src/a.ts', 'docs/a.md']), [
		'Conventions',
		'Markdown',
		'Web app',
		'End-to-end'
	]);
	assert.deepEqual(defaultChecks(['.claude/hooks/a.mjs']), ['Conventions', 'Web app']);
	assert.deepEqual(defaultChecks(['packages/ui/src/a.ts', 'supabase/migrations/1_a.sql']), [
		'Conventions',
		'Web app',
		'UI library',
		'Migrations on local Supabase',
		'End-to-end'
	]);
});

test('fails when a job outside the named ones fails', () => {
	const checks = [
		{ name: 'Web app', bucket: 'pass' },
		{ name: 'UI library', bucket: 'fail' }
	];
	const { overall, states } = summarise(checks, ['Web app']);
	assert.equal(overall, 'fail');
	assert.deepEqual(states, [
		{ name: 'Web app', state: 'pass' },
		{ name: 'UI library', state: 'fail' }
	]);
});

test('reads the arguments strictly', () => {
	assert.deepEqual(parseArgs(['662']), { pr: '662', checks: [], minutes: 40 });
	assert.deepEqual(parseArgs(['--timeout', '40', '655']), { pr: '655', checks: [], minutes: 40 });
	assert.deepEqual(parseArgs(['7', '--check', 'A', '--check', 'B', '--timeout', '5']), {
		pr: '7',
		checks: ['A', 'B'],
		minutes: 5
	});
	assert.throws(() => parseArgs(['7', '--timeout', '30m']), /number of minutes/);
	assert.throws(() => parseArgs(['7', '--timeout']), /number of minutes/);
	assert.throws(() => parseArgs(['7', '--timeout', '0']), /number of minutes/);
	assert.throws(() => parseArgs(['7', '--check']), /Usage/);
	assert.throws(() => parseArgs([]), /Usage/);
	assert.throws(() => parseArgs(['7', '8']), /Unknown argument/);
});

test('waits until every named check has finished', () => {
	assert.equal(summarise([], ['Web app']).overall, 'pending');
	assert.equal(summarise([{ name: 'Web app', bucket: 'pending' }], ['Web app']).overall, 'pending');
	assert.equal(
		summarise(
			[
				{ name: 'Web app', bucket: 'pass' },
				{ name: 'UI library', bucket: 'pending' }
			],
			['Web app', 'UI library']
		).overall,
		'pending'
	);
});

test('passes on pass or skip, fails on any failed or cancelled job of a name', () => {
	const checks = [
		{ name: 'Web app', bucket: 'pass' },
		{ name: 'UI library', bucket: 'pass' },
		{ name: 'UI library', bucket: 'skipping' }
	];
	assert.equal(summarise(checks, ['Web app', 'UI library']).overall, 'pass');
	assert.equal(summarise([{ name: 'Web app', bucket: 'fail' }], ['Web app']).overall, 'fail');
	assert.equal(summarise([{ name: 'Web app', bucket: 'cancel' }], ['Web app']).overall, 'fail');
	assert.deepEqual(summarise([{ name: 'X', bucket: 'skipping' }], ['X']).states, [
		{ name: 'X', state: 'skipping' }
	]);
});
