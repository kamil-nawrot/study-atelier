import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { saveExhibitionPoster } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { loadArtworkImages } from '#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts';
import {
	NEUTRAL_FILTERS,
	NO_POSTER
} from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
import PosterDialog from './PosterDialog.svelte';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	saveExhibitionPoster: vi.fn()
}));
vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages: vi.fn()
}));
vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworksWithNotes: vi.fn(),
	loadArtworkNotes: vi.fn()
}));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', () => ({
	loadNoteLinkLabels: vi.fn(),
	mentionsLinks: vi.fn()
}));

const save = vi.mocked(saveExhibitionPoster);
const images = vi.mocked(loadArtworkImages);

const judith = testArtwork(1, 'Judith');
const olympia = testArtwork(2, 'Olympia');
const url = (name: string) => ({
	kind: 'url' as const,
	url: `https://images.example.test/${name}.jpg`,
	width: 400,
	height: 500
});

function lookup(): ArtworkLookup {
	const known = new ArtworkLookup();
	known.add([judith, olympia]);
	return known;
}

function open(stored = NO_POSTER, onsaved = vi.fn()) {
	render(PosterDialog, {
		open: true,
		exhibitionId: 'exhibition',
		title: 'Light',
		artworkIds: [judith.id, olympia.id],
		lookup: lookup(),
		stored,
		onsaved
	});
	return onsaved;
}

describe('PosterDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		save.mockResolvedValue({});
		images.mockResolvedValue({
			images: new Map([
				[
					judith.id,
					[
						{ ...url('judith'), id: 'judith-0' },
						{ ...url('detail'), id: 'judith-1' }
					]
				],
				[olympia.id, [{ ...url('olympia'), id: 'olympia-0' }]]
			])
		});
	});

	it('saves another artwork, its detail and the filters', async () => {
		const onsaved = open();

		await userEvent.click(page.getByRole('button', { name: 'Olympia' }));
		await userEvent.click(page.getByRole('button', { name: 'Judith' }));
		await userEvent.click(
			page.getByRole('button', { name: m.exhibitions.poster.imageLabel(2, 2) })
		);
		await userEvent.fill(
			page.getByRole('slider', { name: m.exhibitions.poster.filterLabels.sepia }),
			'40'
		);
		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		const poster = {
			artworkId: judith.id,
			imageId: 'judith-1',
			crop: null,
			filters: { ...NEUTRAL_FILTERS, sepia: 40 }
		};
		expect(save).toHaveBeenCalledWith('exhibition', poster);
		expect(onsaved).toHaveBeenCalledWith(poster);
	});

	it('offers the images only for an artwork with more than one', async () => {
		open({ ...NO_POSTER, artworkId: olympia.id });

		await expect
			.element(page.getByRole('button', { name: 'Olympia' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(page.getByText(m.exhibitions.poster.image, { exact: true }).query()).toBeNull();
	});

	it('moves the crop with the arrow keys and zooms with the slider', async () => {
		open({ ...NO_POSTER, artworkId: judith.id });

		page.getByRole('button', { name: m.exhibitions.poster.crop }).element().focus();
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.fill(page.getByRole('slider', { name: m.exhibitions.poster.zoom }), '2');
		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		expect(save.mock.calls[0]?.[1].crop).toEqual({ x: 0.55, y: 0.5, zoom: 2 });
	});

	it('keeps a remembered artwork that left when only the filters change', async () => {
		const stored = { ...NO_POSTER, artworkId: 'gone', imageId: 'gone-1' };
		open(stored);

		await expect.element(page.getByText(m.exhibitions.poster.missing)).toBeVisible();
		await userEvent.fill(
			page.getByRole('slider', { name: m.exhibitions.poster.filterLabels.contrast }),
			'120'
		);
		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		expect(save).toHaveBeenCalledWith('exhibition', {
			...stored,
			filters: { ...NEUTRAL_FILTERS, contrast: 120 }
		});
	});

	it('starts over with the first artwork and no filters', async () => {
		open({
			artworkId: olympia.id,
			imageId: null,
			crop: { x: 0.2, y: 0.2, zoom: 2 },
			filters: { ...NEUTRAL_FILTERS, sepia: 30 }
		});

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.poster.reset }));
		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		expect(save).toHaveBeenCalledWith('exhibition', NO_POSTER);
	});

	it('shows why the poster was not saved and stays open', async () => {
		save.mockResolvedValue({ error: 'Offline.' });
		const onsaved = open();

		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		await expect.element(page.getByText(m.exhibitions.poster.saveErrorTitle)).toBeVisible();
		await expect.element(page.getByText('Offline.')).toBeVisible();
		expect(onsaved).not.toHaveBeenCalled();
	});
});
