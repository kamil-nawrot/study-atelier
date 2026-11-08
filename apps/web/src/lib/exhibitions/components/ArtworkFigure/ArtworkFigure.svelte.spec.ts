import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '@study-atelier/ui/styles.css';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import ArtworkFigure from './ArtworkFigure.svelte';

const loadArtworkNotes = vi.hoisted(() => vi.fn());
const loadArtworksWithNotes = vi.hoisted(() => vi.fn());
const loadArtworkImages = vi.hoisted(() => vi.fn());
const paletteOf = vi.hoisted(() => vi.fn());

vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages
}));
vi.mock('#lib/images/image-palette/image-palette.ts', () => ({ paletteOf }));

vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes,
	loadArtworksWithNotes
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

	it('turns an artwork with notes over to its note in the same frame and back', async () => {
		loadArtworksWithNotes.mockResolvedValue({ ids: new Set(['artwork-7']) });
		loadArtworkNotes.mockResolvedValue({ notes: new Map([['artwork-7', 'Painted in Rome.']]) });
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(7, 'Judith')]);
		await lookup.checkNotes(['artwork-7']);
		render(ArtworkFigure, { lookup, artworkId: 'artwork-7', flippable: true });

		const flip = page.getByRole('button', { name: m.exhibitions.view.flip });
		await expect.element(flip).toHaveAttribute('aria-pressed', 'false');
		expect(loadArtworkNotes).not.toHaveBeenCalled();
		const before = document.querySelector('.mat')?.getBoundingClientRect();
		(flip.element() as HTMLButtonElement).click();

		const back = page.getByRole('region', { name: m.exhibitions.view.noteOf('Judith') });
		await expect.element(back.getByText('Painted in Rome.')).toBeInTheDocument();
		const after = document.querySelector('.mat')?.getBoundingClientRect();
		expect(after?.height).toBe(before?.height);
		expect(after?.width).toBe(before?.width);
		expect(getComputedStyle(document.querySelector('img') as Element).visibility).toBe('hidden');

		(flip.element() as HTMLButtonElement).click();
		await expect.element(back).not.toBeInTheDocument();
		expect(getComputedStyle(document.querySelector('img') as Element).visibility).toBe('visible');
	});

	it('offers no flip for an artwork without notes or while editing', async () => {
		loadArtworksWithNotes.mockResolvedValue({ ids: new Set() });
		const lookup = new ArtworkLookup();
		lookup.add([testArtwork(7, 'Judith'), testArtwork(8, 'Olympia')]);
		await lookup.checkNotes(['artwork-7', 'artwork-8']);
		render(ArtworkFigure, { lookup, artworkId: 'artwork-7', flippable: true });
		render(ArtworkFigure, { lookup, artworkId: 'artwork-8', editable: true });

		await expect.element(page.getByText('Olympia')).toBeInTheDocument();
		expect(page.getByRole('button', { name: m.exhibitions.view.flip }).query()).toBeNull();
	});

	describe('palette', () => {
		const picture = {
			id: 'image-1',
			kind: 'url',
			url: 'https://a.test/a.jpg',
			width: 4,
			height: 3
		};

		function show(props: Record<string, unknown>): void {
			loadArtworkImages.mockResolvedValue({ images: new Map([['artwork-7', [picture]]]) });
			const lookup = new ArtworkLookup();
			lookup.add([testArtwork(7, 'Judith')]);
			render(ArtworkFigure, { lookup, artworkId: 'artwork-7', ...props });
		}

		it('shows the colours under the image', async () => {
			paletteOf.mockResolvedValue({ colours: [{ color: '#aa8855', share: 1 }] });
			show({ palette: true });

			await vi.waitFor(() => expect(document.querySelector('[data-palette]')).not.toBeNull());
			expect(document.querySelector('img')).not.toBeNull();
		});

		it('shows only the colours instead of the image', async () => {
			paletteOf.mockResolvedValue({ colours: [{ color: '#aa8855', share: 1 }] });
			show({ paletteOnly: true });

			await vi.waitFor(() => expect(document.querySelector('[data-palette-only]')).not.toBeNull());
			expect(document.querySelector('img')).toBeNull();
		});

		it('says so instead of the colours when they cannot be read', async () => {
			paletteOf.mockResolvedValue({ unreadable: true });
			show({ paletteOnly: true });

			await expect.element(page.getByText(m.palette.unreadable)).toBeInTheDocument();
			expect(document.querySelector('img')).toBeNull();
		});

		it('keeps the image and says so under it when the colours cannot be read', async () => {
			paletteOf.mockResolvedValue({ unreadable: true });
			show({ palette: true });

			await expect.element(page.getByText(m.palette.unreadable)).toBeInTheDocument();
			expect(document.querySelector('img')).not.toBeNull();
		});

		it('collects the colours while the images are still on their way', async () => {
			loadArtworkImages.mockReturnValue(new Promise(() => {}));
			const lookup = new ArtworkLookup();
			lookup.add([testArtwork(7, 'Judith')]);
			render(ArtworkFigure, { lookup, artworkId: 'artwork-7', palette: true });

			await expect.element(page.getByText(m.palette.collecting)).toBeInTheDocument();
		});
	});
});
