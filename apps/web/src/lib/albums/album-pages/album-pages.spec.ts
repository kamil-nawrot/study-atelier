import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { loadAlbum, loadAlbumListings } from '#lib/albums/album-files/album-files.ts';
import { loadAtelierMatches } from '#lib/albums/album-matches-data/album-matches-data.ts';
import { albumsListed, loadAlbumGallery, loadAlbumList, loadAlbumWalk } from './album-pages.ts';
import type { Album } from '#lib/albums/types/album.ts';

vi.mock('#lib/albums/album-files/album-files.ts', () => ({
	loadAlbumListings: vi.fn(),
	loadAlbum: vi.fn()
}));
vi.mock('#lib/albums/album-matches-data/album-matches-data.ts', () => ({
	loadAtelierMatches: vi.fn()
}));

const listing = { slug: 'sample', languages: ['pl'], sample: true };
const album = {
	slug: 'sample',
	language: 'pl',
	eraCode: 'prehistory',
	title: 'Sample',
	description: '',
	artworks: [{ id: 'venus', wikidataId: null, title: 'Venus' }],
	values: [],
	terms: [],
	events: []
} as unknown as Album;
const fetcher = vi.fn() as unknown as typeof fetch;

describe('album pages', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadAlbumListings).mockResolvedValue([listing]);
		vi.mocked(loadAlbum).mockResolvedValue(album);
		vi.mocked(loadAtelierMatches).mockResolvedValue({
			matches: [{ id: 'a', number: 3, title: 'x', albumEntry: 'sample/venus', wikidataIds: [] }]
		});
	});

	it('lists the albums of the language with how many of each the atelier holds', async () => {
		await expect(loadAlbumList(fetcher, true)).resolves.toEqual({
			albums: [{ album, owned: 1 }],
			error: undefined
		});
		expect(loadAlbumListings).toHaveBeenCalledWith('pl', true, fetcher);
		expect(loadAtelierMatches).toHaveBeenCalledWith({
			slugs: ['sample'],
			wikidataIds: [],
			titles: []
		});
	});

	it('leaves out an album whose files cannot be read and asks nothing without albums', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(undefined);

		await expect(loadAlbumList(fetcher, false)).resolves.toEqual({ albums: [] });
		expect(loadAtelierMatches).not.toHaveBeenCalled();
	});

	it('tells whether any album is listed for the language', async () => {
		await expect(albumsListed(fetcher, true)).resolves.toBe(true);
		expect(loadAlbumListings).toHaveBeenCalledWith('pl', true, fetcher);

		vi.mocked(loadAlbumListings).mockResolvedValue([]);
		await expect(albumsListed(fetcher, false)).resolves.toBe(false);

		vi.mocked(loadAlbumListings).mockResolvedValue(undefined);
		await expect(albumsListed(fetcher, false)).resolves.toBe(false);
	});

	it('says so when the list of albums cannot be read', async () => {
		vi.mocked(loadAlbumListings).mockResolvedValue(undefined);

		await expect(loadAlbumList(fetcher, true)).resolves.toEqual({
			albums: [],
			error: m.albums.loadError
		});
	});

	it('opens a listed album with the matching artworks of the atelier', async () => {
		const gallery = await loadAlbumGallery('sample', fetcher, true);

		expect(gallery.album).toBe(album);
		expect(gallery.matches).toHaveLength(1);
		expect(loadAtelierMatches).toHaveBeenCalledWith({
			slugs: ['sample'],
			wikidataIds: [],
			titles: ['Venus']
		});
	});

	it('does not open an album that is not listed', async () => {
		vi.mocked(loadAlbumListings).mockResolvedValue([]);
		await expect(loadAlbumGallery('other', fetcher, true)).resolves.toEqual({
			matches: [],
			notFound: true
		});
	});

	it('says so when the album files cannot be read', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(undefined);

		await expect(loadAlbumGallery('sample', fetcher, true)).resolves.toEqual({
			matches: [],
			error: m.albums.loadError
		});
	});

	it('opens the ticked artworks of a listed album for the walk', async () => {
		const walk = await loadAlbumWalk('sample', ['venus', 'missing'], fetcher, true);

		expect(walk.album).toBe(album);
		expect(walk.artworks.map((artwork) => artwork.id)).toEqual(['venus']);
	});

	it('does not walk through an album that is not listed', async () => {
		vi.mocked(loadAlbumListings).mockResolvedValue([]);

		await expect(loadAlbumWalk('other', ['venus'], fetcher, true)).resolves.toEqual({
			artworks: [],
			notFound: true
		});
	});

	it('says so when the album of the walk cannot be read', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(undefined);
		await expect(loadAlbumWalk('sample', ['venus'], fetcher, true)).resolves.toEqual({
			artworks: [],
			error: m.albums.loadError
		});

		vi.mocked(loadAlbumListings).mockResolvedValue(undefined);
		await expect(loadAlbumWalk('sample', ['venus'], fetcher, true)).resolves.toEqual({
			artworks: [],
			error: m.albums.loadError
		});
	});
});
