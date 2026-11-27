import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadArtworkVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import { loadItemData } from '#lib/albums/album-items-data/album-items-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { albumWithItems, testAlbum } from '#lib/testing/albums/albums.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import { AlbumAdd } from './album-add.svelte.ts';

vi.mock('#lib/albums/album-version-load/album-version-load.ts', () => ({
	loadArtworkVersion: vi.fn()
}));
vi.mock('#lib/albums/album-items-data/album-items-data.ts', () => ({ loadItemData: vi.fn() }));

const NOTHING = { entries: [], events: [], records: [], details: {} };

function addOf(album: Album = albumWithItems()): AlbumAdd {
	return new AlbumAdd(album, album.artworks);
}

async function toChoice(add: AlbumAdd): Promise<void> {
	await add.start();
	await add.artworkSaved();
	await add.artworkSkipped();
}

describe('AlbumAdd', () => {
	beforeEach(() => {
		vi.mocked(loadArtworkVersion).mockReset();
		vi.mocked(loadArtworkVersion).mockImplementation(async (_album, artwork) => ({
			version: { entryId: artwork.id } as AlbumVersion
		}));
		vi.mocked(loadItemData).mockReset();
		vi.mocked(loadItemData).mockResolvedValue({
			matches: NOTHING,
			entries: [],
			index: testCardIndex()
		});
	});

	it('walks through the artworks first', async () => {
		const add = addOf();

		await add.start();

		expect(add.phase).toBe('artworks');
		expect(add.walk.current?.id).toBe('venus');
	});

	it('goes to the choice of other items once the last artwork is done', async () => {
		const add = addOf();

		await toChoice(add);

		expect(add.phase).toBe('choose');
		expect(add.items.map((item) => item.key)).toContain('term:carving');
		expect([...add.selected].sort()).toEqual(['event:discovery', 'term:carving', 'value:carver']);
		expect(add.index).toBeDefined();
	});

	it('goes to the choice when the learner finishes the artworks early', async () => {
		const add = addOf();
		await add.start();
		await add.artworkSaved();

		await add.artworksFinished();

		expect(add.phase).toBe('choose');
		expect([...add.selected]).toEqual(['term:carving', 'event:discovery', 'value:carver']);
	});

	it('finishes at once when the album has no other items', async () => {
		const add = addOf(testAlbum());
		await add.start();
		await add.artworksFinished();

		expect(add.phase).toBe('done');
		expect(loadItemData).not.toHaveBeenCalled();
		expect(add.message).toBe(m.albums.walk.done('Paleolithic Venuses', 0));
	});

	it('shows the loading error and offers nothing to add', async () => {
		vi.mocked(loadItemData).mockResolvedValue({
			matches: NOTHING,
			entries: [],
			index: testCardIndex(),
			error: 'Network down'
		});
		const add = addOf();

		await toChoice(add);

		expect(add.phase).toBe('choose');
		expect(add.error).toBe('Network down');
		expect(add.items).toEqual([]);
	});

	it('finishes without other items when the learner skips them all', async () => {
		const add = addOf();
		await toChoice(add);

		add.skipAll();

		expect(add.phase).toBe('done');
		expect(add.message).toBe(m.albums.walk.done('Paleolithic Venuses', 1));
	});

	it('ticks and unticks an item and ignores one already in the atelier', async () => {
		const add = addOf();
		await toChoice(add);
		const unrelated = add.items.find((item) => item.key === 'term:unrelated');
		if (!unrelated) throw new Error('missing');

		add.toggle(unrelated);
		expect(add.selected.has('term:unrelated')).toBe(true);
		add.toggle(unrelated);
		expect(add.selected.has('term:unrelated')).toBe(false);

		add.toggle({ ...unrelated, state: 'present' });
		expect(add.selected.has('term:unrelated')).toBe(false);
	});

	it('goes through the ticked items one by one and counts the saved ones', async () => {
		const add = addOf();
		await toChoice(add);

		add.addSelected();

		expect(add.phase).toBe('items');
		expect(add.queue).toHaveLength(3);
		expect(add.current?.key).toBe('term:carving');
		expect(add.lastItem).toBe(false);

		add.itemSaved();
		add.itemSkipped();
		expect(add.current?.key).toBe('value:carver');
		expect(add.lastItem).toBe(true);

		add.itemSaved();

		expect(add.phase).toBe('done');
		expect(add.itemsAdded).toBe(2);
		expect(add.message).toBe(m.albums.closing.done('Paleolithic Venuses', 1, 2));
	});

	it('finishes early when the learner ends the items', async () => {
		const add = addOf();
		await toChoice(add);
		add.addSelected();
		add.itemSaved();

		add.itemsFinished();

		expect(add.phase).toBe('done');
		expect(add.message).toBe(m.albums.closing.done('Paleolithic Venuses', 1, 1));
	});

	it('finishes when nothing is ticked', async () => {
		const add = addOf();
		await toChoice(add);
		add.selected.clear();

		add.addSelected();

		expect(add.phase).toBe('done');
	});
});
