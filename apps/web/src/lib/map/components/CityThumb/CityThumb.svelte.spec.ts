import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import CityThumb from './CityThumb.svelte';

describe('CityThumb', () => {
	it('asks for a pending image once it is near the screen', async () => {
		const images = { request: vi.fn(), failed: vi.fn() } as unknown as WallImages;
		const artwork = testArtwork(4, 'Pending', {
			image: undefined,
			pendingImage: { kind: 'commons', file: 'Pending.jpg' } as never
		});
		render(CityThumb, { artwork, images });

		await expect.element(page.getByRole('link', { name: 'Pending' })).toBeVisible();
		await vi.waitFor(() => expect(images.request).toHaveBeenCalledWith(artwork));
	});

	it('marks an artwork seen in person with a gold dot', async () => {
		const images = { request: vi.fn(), failed: vi.fn() } as unknown as WallImages;
		render(CityThumb, {
			artwork: testArtwork(1, 'Seen', { seen: true }),
			images
		});

		await expect
			.element(page.getByRole('link', { name: `Seen, ${m.map.city.seen}` }))
			.toBeVisible();
		expect(document.querySelector('.seen')).not.toBeNull();
	});
});
