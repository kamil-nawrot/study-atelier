import { describe, expect, it, vi } from 'vitest';
import { ArtworkMark } from './artwork-mark.svelte.ts';

describe('artwork mark', () => {
	it('shows the stored value until the learner toggles it', async () => {
		const save = vi.fn().mockResolvedValue({});
		const mark = new ArtworkMark(save);
		expect(mark.value('a', false)).toBe(false);
		await expect(mark.toggle('a', false)).resolves.toBe(true);
		expect(save).toHaveBeenCalledWith('a', true);
		expect(mark.value('a', false)).toBe(true);
		expect(mark.value('b', true)).toBe(true);
	});

	it('restores the value and keeps the error when saving fails', async () => {
		const mark = new ArtworkMark(vi.fn().mockResolvedValue({ error: 'failed' }));
		await expect(mark.toggle('a', true)).resolves.toBeUndefined();
		expect(mark.value('a', true)).toBe(true);
		expect(mark.error).toBe('failed');
	});
});
