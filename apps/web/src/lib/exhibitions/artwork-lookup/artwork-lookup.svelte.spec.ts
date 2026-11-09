import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	loadArtworkNotes,
	loadArtworksWithNotes
} from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { loadArtworkImages } from '#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts';
import { loadNoteLinkLabels } from '#lib/notes/note-link-data/note-link-data.ts';
import { ArtworkLookup } from './artwork-lookup.svelte.ts';

const images = vi.hoisted(() => ({ request: vi.fn(), failed: vi.fn() }));

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request = images.request;
		failed = images.failed;
	}
}));
vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworkNotes: vi.fn(),
	loadArtworksWithNotes: vi.fn()
}));
vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages: vi.fn()
}));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/notes/note-link-data/note-link-data.ts')>()),
	loadNoteLinkLabels: vi.fn()
}));

const judith = testArtwork(1, 'Judith');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('ArtworkLookup', () => {
	it('knows the artworks it was given, and asks for the images that are still to come', () => {
		const lookup = new ArtworkLookup();

		lookup.add([judith, { ...testArtwork(2, 'Olympia'), pendingImage: true } as never]);

		expect(lookup.get(judith.id)).toEqual(judith);
		expect(lookup.get('missing')).toBeUndefined();
		expect(images.request).toHaveBeenCalledTimes(1);
	});

	it('keeps the artwork it has unless the new one brings the image that was pending', () => {
		const lookup = new ArtworkLookup();
		lookup.add([judith]);

		lookup.add([{ ...judith, title: 'Changed' }]);

		expect(lookup.get(judith.id)?.title).toBe('Judith');
	});

	it('passes a failed image on', () => {
		const lookup = new ArtworkLookup();

		lookup.imageFailed(judith);

		expect(images.failed).toHaveBeenCalledWith(judith);
	});

	it('learns once which artworks have notes and asks again after a failure', async () => {
		vi.mocked(loadArtworksWithNotes)
			.mockResolvedValueOnce({ ids: new Set(), error: 'Boom' })
			.mockResolvedValueOnce({ ids: new Set([judith.id]) });
		const lookup = new ArtworkLookup();

		await lookup.checkNotes([judith.id, 'artwork-2']);
		expect(lookup.hasNote(judith.id)).toBe(false);
		await lookup.checkNotes([judith.id, 'artwork-2']);
		await lookup.checkNotes([judith.id]);

		expect(loadArtworksWithNotes).toHaveBeenCalledTimes(2);
		expect(lookup.hasNote(judith.id)).toBe(true);
		expect(lookup.hasNote('artwork-2')).toBe(false);
	});

	it('loads the note of an artwork once', async () => {
		vi.mocked(loadArtworkNotes).mockResolvedValue({ notes: new Map([[judith.id, 'Rome.']]) });
		const lookup = new ArtworkLookup();
		lookup.add([judith]);

		await lookup.wantNote(judith.id);
		await lookup.wantNote(judith.id);

		expect(loadArtworkNotes).toHaveBeenCalledTimes(1);
		expect(lookup.note(judith.id)).toEqual({ text: 'Rome.' });
	});

	it('reads the labels of the links in a note', async () => {
		const links = { artworks: new Map(), values: new Map() } as never;
		vi.mocked(loadArtworkNotes).mockResolvedValue({
			notes: new Map([[judith.id, 'See [Olympia](/atelier/2)']])
		});
		vi.mocked(loadNoteLinkLabels).mockResolvedValue(links);
		const lookup = new ArtworkLookup();
		lookup.add([judith]);

		await lookup.wantNote(judith.id);

		expect(lookup.note(judith.id)?.links).toBe(links);
		expect(loadNoteLinkLabels).toHaveBeenCalledWith({ artworkNumber: 1 });
	});

	it('treats an artwork without a note as having an empty one', async () => {
		vi.mocked(loadArtworkNotes).mockResolvedValue({ notes: new Map() });
		const lookup = new ArtworkLookup();

		await lookup.wantNote('unknown');

		expect(lookup.note('unknown')).toEqual({ text: '' });
	});

	it('loads the images of an artwork once and keeps them', async () => {
		const image = {
			kind: 'url' as const,
			url: 'https://example.test/a.jpg',
			width: 10,
			height: 20
		};
		vi.mocked(loadArtworkImages).mockResolvedValue({ images: new Map([[judith.id, [image]]]) });
		const lookup = new ArtworkLookup();

		await lookup.wantPictures(judith.id);
		await lookup.wantPictures(judith.id);

		expect(loadArtworkImages).toHaveBeenCalledTimes(1);
		expect(lookup.pictures(judith.id)).toEqual([image]);
	});

	it('knows an artwork without images as one with an empty list', async () => {
		vi.mocked(loadArtworkImages).mockResolvedValue({ images: new Map() });
		const lookup = new ArtworkLookup();

		await lookup.wantPictures('unknown');

		expect(lookup.pictures('unknown')).toEqual([]);
	});

	it('remembers a failed load and asks again only when asked to', async () => {
		vi.mocked(loadArtworkImages)
			.mockResolvedValueOnce({ images: new Map(), error: 'Boom' })
			.mockResolvedValueOnce({ images: new Map() });
		const lookup = new ArtworkLookup();

		expect(await lookup.wantPictures(judith.id)).toEqual({ error: 'Boom' });
		expect(await lookup.wantPictures(judith.id)).toEqual({ error: 'Boom' });
		expect(loadArtworkImages).toHaveBeenCalledTimes(1);
		expect(lookup.pictures(judith.id)).toBeUndefined();
		expect(lookup.picturesFailed(judith.id)).toBe(true);

		expect(await lookup.wantPictures(judith.id, true)).toEqual({});
		expect(loadArtworkImages).toHaveBeenCalledTimes(2);
		expect(lookup.pictures(judith.id)).toEqual([]);
		expect(lookup.picturesFailed(judith.id)).toBe(false);
	});

	it('loads the images of the artworks asked for together in one request', async () => {
		vi.mocked(loadArtworkImages).mockResolvedValue({ images: new Map() });
		const lookup = new ArtworkLookup();

		await Promise.all([lookup.wantPictures('a'), lookup.wantPictures('b')]);

		expect(loadArtworkImages).toHaveBeenCalledTimes(1);
		expect(loadArtworkImages).toHaveBeenCalledWith(['a', 'b']);
	});

	it('lets a second caller wait for the images already on their way', async () => {
		vi.mocked(loadArtworkImages).mockResolvedValue({ images: new Map() });
		const lookup = new ArtworkLookup();

		void lookup.wantPictures(judith.id);
		await lookup.wantPictures(judith.id, true);

		expect(loadArtworkImages).toHaveBeenCalledTimes(1);
		expect(lookup.pictures(judith.id)).toEqual([]);
	});

	it('keeps no note after a failure and asks again the next time', async () => {
		vi.mocked(loadArtworkNotes)
			.mockResolvedValueOnce({ notes: new Map(), error: 'Boom' })
			.mockResolvedValueOnce({ notes: new Map([[judith.id, 'Rome.']]) });
		const lookup = new ArtworkLookup();

		await lookup.wantNote(judith.id);
		expect(lookup.note(judith.id)).toBeUndefined();
		await lookup.wantNote(judith.id);

		expect(loadArtworkNotes).toHaveBeenCalledTimes(2);
		expect(lookup.note(judith.id)).toEqual({ text: 'Rome.' });
	});
});
