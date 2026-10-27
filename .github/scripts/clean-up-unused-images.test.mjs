import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_REMOVALS, cleanUp } from './clean-up-unused-images.mjs';

function fakeApi(count, deletedCount = 0) {
	const removed = [];
	return {
		removed,
		deletedAccountImages: async () =>
			Array.from({ length: deletedCount }, (_, index) => `gone/${index}.jpg`),
		unusedImages: async () => Array.from({ length: count }, (_, index) => `owner/${index}.jpg`),
		remove: async (_bucket, paths) => removed.push(...paths)
	};
}

describe('cleanUp', () => {
	it('removes the unused images up to the limit', async () => {
		const api = fakeApi(MAX_REMOVALS);

		assert.deepEqual(await cleanUp(api, { log: () => {} }), { removed: MAX_REMOVALS });
		assert.equal(api.removed.length, MAX_REMOVALS);
	});

	it('refuses a mass delete and removes nothing', async () => {
		const api = fakeApi(MAX_REMOVALS + 1);

		await assert.rejects(cleanUp(api, { log: () => {} }), /Refusing to remove 101 images/);
		assert.equal(api.removed.length, 0);
	});

	it('removes a mass of images when the run allows it', async () => {
		const api = fakeApi(MAX_REMOVALS + 1);

		await cleanUp(api, { allowMassDelete: true, log: () => {} });
		assert.equal(api.removed.length, MAX_REMOVALS + 1);
	});

	it('removes the images of deleted accounts without counting them towards the limit', async () => {
		const api = fakeApi(MAX_REMOVALS, MAX_REMOVALS + 1);

		assert.deepEqual(await cleanUp(api, { log: () => {} }), { removed: 2 * MAX_REMOVALS + 1 });
		assert.equal(api.removed.length, 2 * MAX_REMOVALS + 1);
	});

	it('calls no removal when nothing is unused', async () => {
		const api = fakeApi(0);
		api.remove = async () => assert.fail('nothing to remove');

		assert.deepEqual(await cleanUp(api, { log: () => {} }), { removed: 0 });
	});
});
