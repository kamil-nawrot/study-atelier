import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import { FlagCount } from './flag-count.svelte.ts';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ countFlags: vi.fn() }));

const count = vi.mocked(countFlags);

describe('FlagCount', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('counts the flags once per learner', async () => {
		count.mockResolvedValue(4);
		const flags = new FlagCount();

		flags.forLearner('learner-1');
		flags.forLearner('learner-1');

		await expect.poll(() => flags.value).toBe(4);
		expect(count).toHaveBeenCalledOnce();
	});

	it('starts again at zero for another learner and keeps the count when the request fails', async () => {
		count
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		const flags = new FlagCount();

		flags.forLearner('learner-1');
		await expect.poll(() => flags.value).toBe(4);
		await flags.refresh();
		await flags.refresh();

		expect(flags.value).toBe(4);
		flags.forLearner(undefined);
		expect(flags.value).toBe(0);
	});
});
