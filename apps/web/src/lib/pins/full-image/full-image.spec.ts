import { beforeEach, describe, expect, it, vi } from 'vitest';
import { career } from '#lib/career/career-state/career-state.svelte.ts';
import { refreshCareerOnFullImage } from './full-image.ts';

vi.mock('#lib/career/career-state/career-state.svelte.ts', () => ({
	career: { refresh: vi.fn() }
}));

describe('refreshCareerOnFullImage', () => {
	beforeEach(() => {
		vi.mocked(career.refresh).mockClear();
	});

	it('refreshes the career when a pin fills the image', () => {
		refreshCareerOnFullImage(10, true);
		expect(career.refresh).toHaveBeenCalledOnce();
	});

	it('leaves the career alone below the limit or when it is hidden', () => {
		refreshCareerOnFullImage(9, true);
		refreshCareerOnFullImage(10, false);
		expect(career.refresh).not.toHaveBeenCalled();
	});
});
