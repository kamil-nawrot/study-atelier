import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import ArtworkFigure from './ArtworkFigure.svelte';

const loadArtworkNotes = vi.hoisted(() => vi.fn());

vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes
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

describe('ArtworkFigure', () => {
	it('shows the image, a link to the artwork and the caption', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(7, 'Judith')]);
		render(ArtworkFigure, { lookup, artworkId: 'artwork-7', caption: 'Candle light' });

		await expect
			.element(page.getByRole('link', { name: 'Judith' }))
			.toHaveAttribute('href', '/atelier/7');
		await expect.element(page.getByText('Candle light')).toBeInTheDocument();
		expect(document.querySelector('img')).not.toBeNull();
	});

	it('shows a frame instead of an image for an artwork it does not know', async () => {
		render(ArtworkFigure, { lookup: new ArtworkLookup(), artworkId: 'gone', caption: '' });

		expect(document.querySelector('img')).toBeNull();
		expect(document.querySelector('a')).toBeNull();
	});

	it('does not link the title while editing', async () => {
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(7, 'Judith')]);
		render(ArtworkFigure, { lookup, artworkId: 'artwork-7', editable: true });

		expect(document.querySelector('a')).toBeNull();
		await expect.element(page.getByText('Judith')).toBeInTheDocument();
	});

	it('quotes the note of the artwork when asked to', async () => {
		loadArtworkNotes.mockResolvedValue({ notes: new Map([['artwork-7', 'Painted in Rome.']]) });
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(7, 'Judith')]);
		render(ArtworkFigure, { lookup, artworkId: 'artwork-7', caption: '', showNote: true });

		await expect.element(page.getByText(m.exhibitions.bar.noteOf('Judith'))).toBeInTheDocument();
		await expect.element(page.getByText('Painted in Rome.')).toBeInTheDocument();
	});
});
