import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAlbumWalk } from '#lib/albums/album-pages/album-pages.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import { load } from './+page.ts';

vi.mock('#lib/albums/album-pages/album-pages.ts', () => ({ loadAlbumWalk: vi.fn() }));
vi.mock('#lib/card-index/own-fields-data/own-fields-data.ts', () => ({
	loadOwnFieldDefinitions: vi.fn()
}));

function run(search: string): ReturnType<typeof load> {
	return load({
		fetch,
		params: { slug: 'sample-album' },
		url: new URL(`http://localhost/atelier/albums/sample-album/add${search}`)
	} as never);
}

describe('add from an album page load', () => {
	beforeEach(() => {
		vi.mocked(loadOwnFieldDefinitions).mockResolvedValue({ fields: [] });
	});

	it('hands the ticked artworks and the own fields to the page', async () => {
		const album = testAlbum();
		vi.mocked(loadAlbumWalk).mockResolvedValue({ album, artworks: [album.artworks[0]] });

		const data = await run('?entries=venus,lion');

		expect(loadAlbumWalk).toHaveBeenCalledWith('sample-album', ['venus', 'lion'], fetch);
		expect(data).toMatchObject({ album, artworks: [album.artworks[0]], ownFields: [] });
	});

	it('returns to the gallery when none of the entries is in the album', async () => {
		vi.mocked(loadAlbumWalk).mockResolvedValue({ album: testAlbum(), artworks: [] });

		await expect(run('?entries=other')).rejects.toMatchObject({
			status: 307,
			location: '/atelier/albums/sample-album'
		});
	});

	it('leaves out the own fields that could not be loaded', async () => {
		vi.mocked(loadAlbumWalk).mockResolvedValue({ artworks: [], notFound: true });
		vi.mocked(loadOwnFieldDefinitions).mockResolvedValue({ fields: [], error: 'x' });

		await expect(run('')).resolves.toMatchObject({ notFound: true, ownFields: undefined });
	});
});
