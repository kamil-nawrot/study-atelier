import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadArtworkVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import { testAlbum } from '#lib/testing/albums/albums.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';

vi.mock('#lib/albums/album-version-load/album-version-load.ts', () => ({
	loadArtworkVersion: vi.fn()
}));
vi.mock('#lib/artworks/artwork-data/artwork-data.ts', () => ({ loadArtwork: vi.fn() }));

function versionOf(entryId: string): AlbumVersion {
	return { entryId } as AlbumVersion;
}

function walkOf(): AlbumWalk {
	const album = testAlbum();
	return new AlbumWalk(album, album.artworks);
}

describe('AlbumWalk', () => {
	beforeEach(() => {
		vi.mocked(loadArtwork).mockReset();
		vi.mocked(loadArtworkVersion).mockReset();
		vi.mocked(loadArtworkVersion).mockImplementation(async (_album, artwork) => ({
			version: versionOf(artwork.id)
		}));
	});

	it('opens the first artwork with its album version', async () => {
		const walk = walkOf();

		await walk.open();

		expect(walk.current?.id).toBe('venus');
		expect(walk.version?.entryId).toBe('venus');
		expect(walk.last).toBe(false);
	});

	it('goes to the next artwork after a save and counts it as added', async () => {
		const walk = walkOf();
		await walk.open();

		await walk.saved();

		expect(walk.current?.id).toBe('lion');
		expect(walk.version?.entryId).toBe('lion');
		expect(walk.added).toBe(1);
		expect(walk.statusOf(walk.artworks[0])).toBe('saved');
		expect(walk.statusOf(walk.artworks[1])).toBe('current');
		expect(walk.statusOf(walk.artworks[2])).toBe('todo');
	});

	it('does not count a skipped artwork as added', async () => {
		const walk = walkOf();
		await walk.open();

		await walk.skip();

		expect(walk.added).toBe(0);
		expect(walk.statusOf(walk.artworks[0])).toBe('skipped');
		expect(walk.current?.id).toBe('lion');
	});

	it('finishes after the last artwork', async () => {
		const walk = walkOf();
		await walk.open();
		await walk.saved();
		await walk.skip();

		expect(walk.last).toBe(true);
		await walk.saved();

		expect(walk.finished).toBe(true);
		expect(walk.current).toBeUndefined();
		expect(walk.added).toBe(2);
	});

	it('leaves the artworks that were not reached out when finished early', async () => {
		const walk = walkOf();
		await walk.open();
		await walk.saved();

		walk.finish();

		expect(walk.finished).toBe(true);
		expect(walk.added).toBe(1);
		expect(walk.statusOf(walk.artworks[2])).toBe('todo');
	});

	it('keeps the error when the learner values cannot be loaded', async () => {
		vi.mocked(loadArtworkVersion).mockResolvedValue({ error: 'Network down' });
		const walk = walkOf();

		await walk.open();

		expect(walk.version).toBeUndefined();
		expect(walk.error).toBe('Network down');
	});

	it('ignores a version that arrives after the learner has moved on', async () => {
		let release: (value: { version: AlbumVersion }) => void = () => {};
		vi.mocked(loadArtworkVersion).mockImplementationOnce(
			() => new Promise((resolve) => (release = resolve))
		);
		const walk = walkOf();
		const slow = walk.open();

		await walk.skip();
		release({ version: versionOf('venus') });
		await slow;

		expect(walk.version?.entryId).toBe('lion');
	});

	it("opens a similar artwork as a comparison with the learner's artwork", async () => {
		const mine = { id: 'artwork-7', number: 7 } as ArtworkRecord;
		vi.mocked(loadArtwork).mockResolvedValue({ artwork: mine });
		const album = testAlbum();
		const walk = new AlbumWalk(album, album.artworks, { venus: 7 });

		await walk.open();

		expect(loadArtwork).toHaveBeenCalledWith(7);
		expect(walk.mine).toBe(mine);
		expect(walk.comparing).toBe(true);

		walk.addAsNew();

		expect(walk.comparing).toBe(false);
	});

	it('counts a completed artwork apart from the added ones but hands it to the closing step', async () => {
		vi.mocked(loadArtwork).mockResolvedValue({ artwork: { number: 7 } as ArtworkRecord });
		const album = testAlbum();
		const walk = new AlbumWalk(album, album.artworks, { venus: 7 });
		await walk.open();

		await walk.completed();

		expect(walk.added).toBe(0);
		expect(walk.merged).toBe(1);
		expect(walk.savedIds).toEqual(['venus']);
		expect(walk.statusOf(walk.artworks[0])).toBe('merged');
		expect(walk.comparing).toBe(false);
		expect(loadArtwork).toHaveBeenCalledOnce();
	});

	it('compares with an artwork the learner picks by hand and keeps it for the artwork', async () => {
		const mine = { id: 'artwork-9', number: 9 } as ArtworkRecord;
		vi.mocked(loadArtwork).mockResolvedValue({ artwork: mine });
		const walk = walkOf();
		await walk.open();

		walk.pick();
		expect(walk.picking).toBe(true);
		expect(walk.comparing).toBe(false);

		await walk.compareWith(9);

		expect(loadArtwork).toHaveBeenCalledWith(9);
		expect(walk.picking).toBe(false);
		expect(walk.mine).toBe(mine);
		expect(walk.comparing).toBe(true);
		expect(walk.chosen).toBe(true);

		await walk.completed();

		expect(walk.merged).toBe(1);
		expect(walk.chosen).toBe(false);
		expect(walk.mine).toBeUndefined();
	});

	it('picks another artwork in place of a similar one after "dodaj jako nowe"', async () => {
		const similar = { id: 'artwork-7', number: 7 } as ArtworkRecord;
		const picked = { id: 'artwork-9', number: 9 } as ArtworkRecord;
		vi.mocked(loadArtwork).mockResolvedValueOnce({ artwork: similar });
		vi.mocked(loadArtwork).mockResolvedValueOnce({ artwork: picked });
		const album = testAlbum();
		const walk = new AlbumWalk(album, album.artworks, { venus: 7 });
		await walk.open();
		walk.addAsNew();

		walk.pick();
		await walk.compareWith(9);

		expect(walk.mine).toBe(picked);
		expect(walk.comparing).toBe(true);
	});

	it('stays on the picker with the error when the picked artwork cannot be loaded', async () => {
		vi.mocked(loadArtwork).mockResolvedValue({ error: 'Network down' });
		const walk = walkOf();
		await walk.open();
		walk.pick();

		await walk.compareWith(9);

		expect(walk.picking).toBe(true);
		expect(walk.pickError).toBe('Network down');
		expect(walk.error).toBe('');
		expect(walk.comparing).toBe(false);
	});

	it('goes back to the form from the picker', async () => {
		const walk = walkOf();
		await walk.open();
		walk.pick();

		walk.cancelPick();

		expect(walk.picking).toBe(false);
		expect(walk.version?.entryId).toBe('venus');
	});
});
