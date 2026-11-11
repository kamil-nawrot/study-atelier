import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { defaultChecks, summarise } from './wait-ci.mjs';

test('picks the checks from the changed files', () => {
	assert.deepEqual(defaultChecks(['docs/a.md', 'CLAUDE.md']), ['Markdown']);
	assert.deepEqual(defaultChecks(['apps/web/src/a.ts', 'docs/a.md']), ['Web app']);
	assert.deepEqual(defaultChecks(['packages/ui/src/a.ts', 'supabase/migrations/1_a.sql']), [
		'Web app',
		'UI library',
		'Migrations on local Supabase'
	]);
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
