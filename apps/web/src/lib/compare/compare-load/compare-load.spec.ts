import { beforeEach, describe, expect, it, vi } from 'vitest';
import { artworkCore } from '#lib/artworks/artwork-preload/artwork-preload.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { loadAlbumVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import { m } from '#lib/i18n/i18n.ts';
import { loadAlbumComparison, loadComparison } from './compare-load.ts';

vi.mock('#lib/artworks/artwork-preload/artwork-preload.ts', () => ({ artworkCore: vi.fn() }));
vi.mock('#lib/albums/album-version-load/album-version-load.ts', () => ({
	loadAlbumVersion: vi.fn()
}));

const first = { id: 'a', number: 1 } as ArtworkRecord;
const second = { id: 'b', number: 2 } as ArtworkRecord;

describe('loadComparison', () => {
	beforeEach(() => vi.mocked(artworkCore).mockReset());

	it('loads both artworks', async () => {
		vi.mocked(artworkCore).mockImplementation((number) =>
			Promise.resolve({ artwork: number === 1 ? first : second })
		);

		expect(await loadComparison({ left: 1, right: 2 })).toEqual({
			left: first,
			right: second,
			error: undefined
		});
	});

	it('loads nothing for an empty half', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ artwork: first });

		const result = await loadComparison({ left: 1, right: null });

		expect(result.right).toBeUndefined();
		expect(artworkCore).toHaveBeenCalledTimes(1);
	});

	it('leaves the half of an artwork that is not in the atelier empty', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ notFound: true, error: 'not found' });

		expect(await loadComparison({ left: 99, right: null })).toEqual({
			left: undefined,
			right: undefined,
			error: undefined
		});
	});

	it('reports a load failure', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ error: 'network' });

		expect((await loadComparison({ left: 1, right: null })).error).toBe('network');
	});
});

describe('loadAlbumComparison', () => {
	const entry = { slug: 'venus', entryId: 'willendorf' };
	const version = { slug: 'venus', entryId: 'willendorf' } as AlbumVersion;

	beforeEach(() => {
		vi.mocked(artworkCore).mockReset();
		vi.mocked(loadAlbumVersion).mockReset();
	});

	it('loads the artwork and the album version together', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ artwork: first });
		vi.mocked(loadAlbumVersion).mockResolvedValue({ version });

		expect(await loadAlbumComparison(1, entry)).toEqual({ mine: first, version });
	});

	it('says when the album has no such entry', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ artwork: first });
		vi.mocked(loadAlbumVersion).mockResolvedValue({});

		expect(await loadAlbumComparison(1, entry)).toEqual({ error: m.compare.albumEntryMissing });
	});

	it('says when the artwork is not in the atelier', async () => {
		vi.mocked(artworkCore).mockResolvedValue({ notFound: true, error: 'x' });
		vi.mocked(loadAlbumVersion).mockResolvedValue({ version });

		expect(await loadAlbumComparison(null, entry)).toEqual({ error: m.artworkErrors.notFound });
	});
});
