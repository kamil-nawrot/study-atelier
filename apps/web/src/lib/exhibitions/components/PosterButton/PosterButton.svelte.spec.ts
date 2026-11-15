import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { saveExhibitionPoster } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { loadArtworkImages } from '#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts';
import {
	NEUTRAL_FILTERS,
	NO_POSTER
} from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
import PosterButton from './PosterButton.svelte';

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
const judith = testArtwork(1, 'Judith');

function documentWith(...ids: string[]): ExhibitionDocument {
	return {
		type: 'doc',
		content: ids.map((artworkId) => ({ type: 'artwork', attrs: { artworkId } }))
	};
}

function lookup(): ArtworkLookup {
	const known = new ArtworkLookup();
	known.add([judith]);
	return known;
}

describe('PosterButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		save.mockResolvedValue({});
		vi.mocked(loadArtworkImages).mockResolvedValue({ images: new Map() });
	});

	it('waits for the first artwork of the exhibition', async () => {
		render(PosterButton, {
			exhibitionId: 'exhibition',
			title: 'Light',
			document: documentWith('gone'),
			lookup: lookup(),
			poster: NO_POSTER
		});

		await expect
			.element(page.getByRole('button', { name: m.exhibitions.poster.open }))
			.toBeDisabled();
		expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(
			m.exhibitions.poster.noArtworks
		);
	});

	it('opens the poster, saves it and confirms', async () => {
		render(PosterButton, {
			exhibitionId: 'exhibition',
			title: 'Light',
			document: documentWith(judith.id),
			lookup: lookup(),
			poster: { ...NO_POSTER, filters: { ...NEUTRAL_FILTERS, sepia: 20 } }
		});

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.poster.open }));
		await expect
			.element(page.getByRole('dialog', { name: m.exhibitions.poster.title }))
			.toBeVisible();
		await userEvent.click(page.getByRole('button', { name: m.common.save }));

		await expect.element(page.getByText(m.exhibitions.poster.saved)).toBeVisible();
		expect(save).toHaveBeenCalledWith('exhibition', {
			...NO_POSTER,
			filters: { ...NEUTRAL_FILTERS, sepia: 20 }
		});
	});
});
