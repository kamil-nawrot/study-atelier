import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import CloseUpDialog from './CloseUpDialog.svelte';

const loadArtworkImages = vi.hoisted(() => vi.fn());

vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages
}));
vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

const picture = {
	id: 'i1',
	kind: 'url',
	url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='gray'/></svg>",
	width: 400,
	height: 300
};

function lookupWith(images: unknown[]): ArtworkLookup {
	loadArtworkImages.mockResolvedValue({ images: new Map([['artwork-7', images]]) });
	const lookup = new ArtworkLookup();
	lookup.add([testArtwork(7, 'Judith')]);
	return lookup;
}

describe('CloseUpDialog', () => {
	it('picks the spot on the image and adds the close-up', async () => {
		const onpick = vi.fn();
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick
		});

		await vi.waitFor(() => expect(document.querySelector('[data-stage]')).not.toBeNull());
		const stage = page.elementLocator(document.querySelector('[data-stage]') as Element);
		await stage.click({ position: { x: 10, y: 10 } });
		await page.getByRole('button', { name: m.exhibitions.closeUpDialog.add }).click();

		expect(onpick).toHaveBeenCalledTimes(1);
		const attributes = onpick.mock.calls[0]?.[0];
		expect(attributes.artworkId).toBe('artwork-7');
		expect(attributes.imageId).toBe('i1');
		expect(attributes.x).toBeLessThan(0.5);
		expect(attributes.y).toBeLessThan(0.5);
	});

	it('says so when the artwork has no image', async () => {
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([]),
			artworkId: 'artwork-7',
			onpick: vi.fn()
		});

		await expect.element(page.getByText(m.exhibitions.closeUpDialog.noImage)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.closeUpDialog.add }))
			.toBeDisabled();
	});
});
