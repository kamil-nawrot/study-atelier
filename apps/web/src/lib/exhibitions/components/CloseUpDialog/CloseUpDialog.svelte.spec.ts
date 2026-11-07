import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import CloseUpDialog from './CloseUpDialog.svelte';

const loadArtworkImages = vi.hoisted(() => vi.fn());
const loadArtworkPins = vi.hoisted(() => vi.fn());

vi.mock('#lib/pins/pin-data/pin-data.ts', () => ({ loadArtworkPins }));

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

function pin(id: string, text: string, viewWidth?: number, imageId = 'i1'): object {
	return { id, imageId, x: 0.2, y: 0.3, text, glossaryEntryId: null, viewWidth };
}

describe('CloseUpDialog', () => {
	it('lists the pins of the artwork and adds the one that was picked', async () => {
		loadArtworkPins.mockResolvedValue({
			pins: [pin('p1', 'Dłoń', 0.4), pin('p2', '', undefined), pin('p3', 'Gone', 0.3, 'other')]
		});
		const onpick = vi.fn();
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick
		});

		await expect.element(page.getByText(m.exhibitions.closeUpDialog.hint)).toBeInTheDocument();
		expect(loadArtworkPins).toHaveBeenCalledWith(7);
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.closeUpDialog.pin(2) }))
			.toBeInTheDocument();
		expect(page.getByRole('button', { name: 'Gone' }).query()).toBeNull();

		await page.getByRole('button', { name: 'Dłoń' }).click();

		expect(onpick).toHaveBeenCalledWith({
			artworkId: 'artwork-7',
			imageId: 'i1',
			x: 0.2,
			y: 0.3,
			viewWidth: 0.4
		});
	});

	it('gives a pin without a view the default size', async () => {
		loadArtworkPins.mockResolvedValue({ pins: [pin('p2', 'Oko')] });
		const onpick = vi.fn();
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick
		});

		await page.getByRole('button', { name: 'Oko' }).click();

		expect(onpick).toHaveBeenCalledWith(expect.objectContaining({ viewWidth: 0.25 }));
	});

	it('sends the learner to the artwork when it has no pins yet', async () => {
		loadArtworkPins.mockResolvedValue({ pins: [] });
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick: vi.fn()
		});

		await expect.element(page.getByText(m.exhibitions.closeUpDialog.noPins)).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.exhibitions.closeUpDialog.openArtwork }))
			.toHaveAttribute('href', '/atelier/7');
	});

	it('says when the pins could not be loaded', async () => {
		loadArtworkPins.mockResolvedValue({ pins: [], error: 'Boom' });
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick: vi.fn()
		});

		await expect.element(page.getByText(m.exhibitions.closeUpDialog.loadError)).toBeInTheDocument();
	});

	it('waits for an artwork it does not know yet', async () => {
		loadArtworkPins.mockClear();
		render(CloseUpDialog, {
			open: true,
			lookup: new ArtworkLookup(),
			artworkId: 'unknown',
			onpick: vi.fn()
		});

		await expect.element(page.getByText(m.exhibitions.closeUpDialog.loading)).toBeInTheDocument();
		expect(loadArtworkPins).not.toHaveBeenCalled();
	});

	it('closes with Cancel', async () => {
		loadArtworkPins.mockResolvedValue({ pins: [] });
		render(CloseUpDialog, {
			open: true,
			lookup: lookupWith([picture]),
			artworkId: 'artwork-7',
			onpick: vi.fn()
		});

		await page.getByRole('button', { name: m.common.cancel }).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
