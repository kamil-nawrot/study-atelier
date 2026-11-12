import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isOwnersUntracked, splitNul, summary, touchesRootConfig } from './verify.mjs';

test('reads file names with non-ASCII characters from a NUL separated list', () => {
	assert.deepEqual(splitNul('docs/Rzeźba.md\0apps/web/src/a b.ts\0'), [
		'docs/Rzeźba.md',
		'apps/web/src/a b.ts'
	]);
	assert.deepEqual(splitNul(''), []);
});

test('leaves untracked files of the owner out', () => {
	assert.ok(isOwnersUntracked('design/sketch.json'));
	assert.ok(isOwnersUntracked('supabase/snippets/query.sql'));
	assert.ok(!isOwnersUntracked('supabase/migrations/1_a.sql'));
	assert.ok(!isOwnersUntracked('apps/web/src/a.ts'));
});

test('knows the root configs that every package depends on', () => {
	assert.ok(touchesRootConfig(['package.json']));
	assert.ok(touchesRootConfig(['eslint.config.js']));
	assert.ok(touchesRootConfig(['tsconfig.base.json']));
	assert.ok(touchesRootConfig(['lint/allowlist.json']));
	assert.ok(!touchesRootConfig(['apps/web/package.json', 'docs/a.md']));
});

test('does not call an empty run a pass', () => {
	assert.match(summary([], ['a.ts'], false), /No check applies/);
	assert.equal(summary([{ passed: true }], [], false), 'All 1 checks passed.');
	assert.equal(summary([{ passed: true }, { passed: false }], [], false), '1 of 2 checks failed.');
});
