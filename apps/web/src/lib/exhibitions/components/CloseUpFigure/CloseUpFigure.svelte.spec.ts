import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import CloseUpFigure from './CloseUpFigure.svelte';

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

const picture = { id: 'i1', kind: 'url', url: 'https://a.test/a.jpg', width: 400, height: 300 };

function lookupWith(images: unknown[]): ArtworkLookup {
	loadArtworkImages.mockResolvedValue({ images: new Map([['artwork-7', images]]) });
	const lookup = new ArtworkLookup();
	lookup.add([testArtwork(7, 'Judith')]);
	return lookup;
}

describe('CloseUpFigure', () => {
	it('crops the fragment and links the artwork in the caption', async () => {
		render(CloseUpFigure, {
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			x: 0.5,
			y: 0.5,
			viewWidth: 0.4
		});

		await vi.waitFor(() => expect(document.querySelector('[data-fragment]')).not.toBeNull());
		await expect
			.element(page.getByRole('link', { name: 'Judith' }))
			.toHaveAttribute('href', '/atelier/7');
		await expect.element(page.getByText(m.exhibitions.closeUp.caption)).toBeInTheDocument();
	});

	it('does not link the caption while editing, and reports a click', async () => {
		const onselect = vi.fn();
		render(CloseUpFigure, {
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			x: 0.5,
			y: 0.5,
			viewWidth: 0.4,
			editable: true,
			onselect
		});

		await vi.waitFor(() => expect(document.querySelector('[data-fragment]')).not.toBeNull());
		expect(document.querySelector('a')).toBeNull();
		await page.getByRole('img').click();
		expect(onselect).toHaveBeenCalled();
	});

	it('shows a frame while the image is unknown', async () => {
		render(CloseUpFigure, {
			lookup: lookupWith([]),
			artworkId: 'artwork-7',
			x: 0.5,
			y: 0.5,
			viewWidth: 0.4
		});

		await vi.waitFor(() => expect(loadArtworkImages).toHaveBeenCalled());
		expect(document.querySelector('[data-fragment]')).toBeNull();
	});
});
