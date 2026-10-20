import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateCheck } from './duplicate-check.svelte.ts';
import { findDuplicates } from './duplicates.ts';

vi.mock('./duplicates.ts', () => ({ findDuplicates: vi.fn() }));

const artwork = { title: 'Sunflowers', authors: ['Vincent van Gogh'] };

describe('DuplicateCheck', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('proceeds without a question when nothing matches', async () => {
		vi.mocked(findDuplicates).mockResolvedValue([]);
		const check = new DuplicateCheck();

		await expect(check.confirm(artwork, 'id-1')).resolves.toBe(true);

		expect(findDuplicates).toHaveBeenCalledWith(artwork, 'id-1');
		expect(check.open).toBe(false);
	});

	it('opens with the matching numbers and resolves with the answer', async () => {
		vi.mocked(findDuplicates).mockResolvedValue([5, 17]);
		const check = new DuplicateCheck();

		const answer = check.confirm(artwork);
		await vi.waitFor(() => expect(check.open).toBe(true));
		expect(check.numbers).toEqual([5, 17]);
		check.answer(true);

		await expect(answer).resolves.toBe(true);
		expect(check.open).toBe(false);
	});

	it('resolves false when the learner steps back', async () => {
		vi.mocked(findDuplicates).mockResolvedValue([5]);
		const check = new DuplicateCheck();

		const answer = check.confirm(artwork);
		await vi.waitFor(() => expect(check.open).toBe(true));
		check.answer(false);

		await expect(answer).resolves.toBe(false);
	});
});
