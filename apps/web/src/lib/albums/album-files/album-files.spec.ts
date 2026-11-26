import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { loadAlbum, loadAlbumListings, readAlbumIndex } from './album-files.ts';

function staticFetch(missing: string[] = []): typeof fetch {
	return vi.fn(async (url: string | URL | Request) => {
		const path = String(url).replace(/^.*\/albums\//, '');
		if (missing.includes(path)) return new Response(null, { status: 404 });
		return new Response(readFileSync(`static/albums/${path}`));
	}) as unknown as typeof fetch;
}

describe('readAlbumIndex', () => {
	it('lists the albums with their languages and whether they are samples', () => {
		expect(
			readAlbumIndex({
				format: 1,
				albums: [
					{ slug: 'first', languages: ['pl', 'en'] },
					{ slug: 'test', languages: ['pl'], sample: true }
				]
			})
		).toEqual({
			albums: [
				{ slug: 'first', languages: ['pl', 'en'], sample: false },
				{ slug: 'test', languages: ['pl'], sample: true }
			]
		});
	});

	it('refuses an album without a language, a repeated slug and a language that is no code', () => {
		expect(
			readAlbumIndex({
				format: 1,
				albums: [
					{ slug: 'first', languages: [] },
					{ slug: 'first', languages: ['polish'] }
				]
			}).errors
		).toEqual([
			'albums[0].languages: is empty',
			'albums[1].languages[0]: does not match /^[a-z]{2}$/',
			'albums[1].languages: is empty',
			'albums: repeats the id "first"'
		]);
	});
});

describe('loadAlbumListings', () => {
	it('lists the sample album only when samples are wanted, and only in its languages', async () => {
		expect(await loadAlbumListings('pl', true, staticFetch())).toEqual([
			{ slug: 'sample-album', languages: ['pl'], sample: true }
		]);
		expect(await loadAlbumListings('pl', false, staticFetch())).toEqual([]);
		expect(await loadAlbumListings('en', true, staticFetch())).toEqual([]);
	});

	it('has no list when the index cannot be read', async () => {
		expect(await loadAlbumListings('pl', true, staticFetch(['index.json']))).toBeUndefined();
	});
});

describe('loadAlbum', () => {
	it('loads an album in one language from its two files', async () => {
		const fetcher = staticFetch();

		const album = await loadAlbum('sample-album', 'pl', fetcher);

		expect(album?.title).toBe('Sample album');
		expect(album?.artworks).toHaveLength(3);
		expect(vi.mocked(fetcher).mock.calls.map(([url]) => String(url))).toEqual([
			expect.stringMatching(/\/albums\/sample-album\/album\.json$/),
			expect.stringMatching(/\/albums\/sample-album\/pl\.json$/)
		]);
	});

	it('has no album without the texts of the language or when the network fails', async () => {
		expect(
			await loadAlbum('sample-album', 'en', staticFetch(['sample-album/en.json']))
		).toBeUndefined();
		const offline = vi.fn().mockRejectedValue(new TypeError('offline')) as unknown as typeof fetch;
		expect(await loadAlbum('sample-album', 'pl', offline)).toBeUndefined();
	});
});
