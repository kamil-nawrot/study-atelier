import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { outOfOrder } from './check-migration-order.mjs';

const onBase = ['20261104150000_review_time.sql', '20261105110000_typed_title.sql'];

describe('outOfOrder', () => {
	it('accepts migrations newer than the newest on the base branch', () => {
		assert.deepEqual(outOfOrder(['20261105120000_note_gap.sql'], onBase), []);
	});

	it('rejects a migration older than the newest on the base branch', () => {
		assert.deepEqual(outOfOrder(['20261105100000_note_gap.sql'], onBase), [
			'Migration 20261105100000_note_gap.sql is not newer than 20261105110000_typed_title.sql, the newest on the base branch. Rename it to a later timestamp.'
		]);
	});

	it('rejects a migration with the same timestamp as the newest on the base branch', () => {
		assert.equal(outOfOrder(['20261105110000_other.sql'], onBase).length, 1);
	});

	it('accepts an older migration already on main, as a hotfix merged back', () => {
		assert.deepEqual(
			outOfOrder(['20261105100000_hotfix.sql'], onBase, ['20261105100000_hotfix.sql']),
			[]
		);
	});

	it('accepts anything when the base branch has no migrations', () => {
		assert.deepEqual(outOfOrder(['20261105100000_note_gap.sql'], []), []);
	});
});
