import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAlbum } from '#lib/albums/album-files/album-files.ts';
import type { Album } from '#lib/albums/types/album.ts';
import { loadAlbumOrigin } from './album-origin.ts';

vi.mock('#lib/albums/album-files/album-files.ts', () => ({ loadAlbum: vi.fn() }));

const ALBUM = {
	slug: 'venus',
	title: 'Wenus paleolityczne',
	artworks: [{ id: 'willendorf', revision: 2 }]
} as Album;

describe('loadAlbumOrigin', () => {
	beforeEach(() => vi.mocked(loadAlbum).mockReset());

	it('names the album and links its gallery', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(ALBUM);

		expect(await loadAlbumOrigin({ entry: 'venus/willendorf', revision: 2 }, 42)).toEqual({
			albumTitle: 'Wenus paleolityczne',
			albumHref: '/atelier/albums/venus'
		});
	});

	it('points to the comparison when the album holds a newer revision', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(ALBUM);

		const origin = await loadAlbumOrigin({ entry: 'venus/willendorf', revision: 1 }, 42);

		expect(origin?.newerHref).toBe('/atelier/compare?left=42&album=venus%2Fwillendorf');
	});

	it('says nothing for an artwork without an album or a withdrawn album', async () => {
		vi.mocked(loadAlbum).mockResolvedValue(undefined);

		expect(await loadAlbumOrigin(undefined, 42)).toBeUndefined();
		expect(await loadAlbumOrigin({ entry: 'venus/willendorf', revision: 1 }, 42)).toBeUndefined();
		expect(loadAlbum).toHaveBeenCalledOnce();
	});
});
