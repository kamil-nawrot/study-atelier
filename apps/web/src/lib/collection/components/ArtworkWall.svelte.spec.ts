import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/testing/artworks.ts';
import { distribute } from '../masonry.ts';
import ArtworkWall from './ArtworkWall.svelte';

vi.mock('../masonry.ts', async (importOriginal) => {
	const original = await importOriginal<typeof import('../masonry.ts')>();
	return { ...original, distribute: vi.fn(original.distribute) };
});

const artworks = Array.from({ length: 8 }, (_, index) =>
	testArtwork(index + 1, `Artwork ${index + 1}`)
);

describe('ArtworkWall', () => {
	beforeEach(() => {
		vi.mocked(distribute).mockClear();
	});

	it('spreads the artworks over the columns that fit the width', async () => {
		await page.viewport(1000, 800);

		const { container } = await render(ArtworkWall, { artworks });

		expect(container.querySelectorAll('ul.column')).toHaveLength(3);
		await page.viewport(1400, 800);
		await vi.waitFor(() => expect(container.querySelectorAll('ul.column')).toHaveLength(4));
	});

	it('does not spread the artworks again while the width changes within the same columns', async () => {
		await page.viewport(1000, 800);
		const { container } = await render(ArtworkWall, { artworks });
		const calls = vi.mocked(distribute).mock.calls.length;

		await page.viewport(1100, 800);
		await page.viewport(1200, 800);
		await vi.waitFor(() => expect(window.innerWidth).toBe(1200));

		expect(container.querySelectorAll('ul.column')).toHaveLength(3);
		expect(vi.mocked(distribute)).toHaveBeenCalledTimes(calls);
	});
});
