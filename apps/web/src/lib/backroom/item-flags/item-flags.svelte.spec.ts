import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { ItemFlags } from './item-flags.svelte.ts';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ loadItemFlags: vi.fn() }));

const flag = (id: string): StoredFlag => ({
	id,
	reason: 'data',
	comment: null,
	artworkId: 'a1',
	termId: null,
	symbolId: null,
	imageId: null,
	pinId: null
});

describe('ItemFlags', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the flags of its item and loads them again after a change', async () => {
		vi.mocked(loadItemFlags)
			.mockResolvedValueOnce([flag('one')])
			.mockResolvedValueOnce([]);
		const flags = new ItemFlags({ artworkId: 'a1' });

		await flags.load();
		expect(flags.list.map((found) => found.id)).toEqual(['one']);
		await flags.load();

		expect(flags.list).toEqual([]);
		expect(loadItemFlags).toHaveBeenLastCalledWith({ artworkId: 'a1' });
	});

	it('keeps only the answer of the latest load', async () => {
		let finishFirst: (flags: StoredFlag[]) => void = () => {};
		vi.mocked(loadItemFlags)
			.mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)))
			.mockResolvedValueOnce([flag('second')]);
		const flags = new ItemFlags();

		const first = flags.load({ termId: 't1' });
		await flags.load({ termId: 't2' });
		finishFirst([flag('first')]);
		await first;

		expect(flags.list.map((found) => found.id)).toEqual(['second']);
	});

	it('shows no flags when they cannot be loaded', async () => {
		vi.mocked(loadItemFlags).mockRejectedValueOnce(new TypeError('Failed to fetch'));
		const flags = new ItemFlags({ symbolId: 's1' });

		await flags.load();

		expect(flags.list).toEqual([]);
	});
});
