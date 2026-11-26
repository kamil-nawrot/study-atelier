import { describe, expect, it } from 'vitest';
import {
	albumAddHref,
	artworksToAdd,
	entryIdsOf
} from '#lib/albums/album-add-address/album-add-address.ts';
import type { Album } from '#lib/albums/types/album.ts';

const album = {
	slug: 'venuses',
	artworks: [{ id: 'first' }, { id: 'second' }, { id: 'third' }]
} as Album;

describe('albumAddHref', () => {
	it('puts the ticked entries in the address of the add page', () => {
		expect(albumAddHref('venuses', ['first', 'third'])).toBe(
			'/atelier/albums/venuses/add?entries=first%2Cthird'
		);
	});
});

describe('entryIdsOf', () => {
	it('reads the entries and drops anything that is not an entry id', () => {
		const params = new URLSearchParams({ entries: 'first,,Bad Id,third' });

		expect(entryIdsOf(params)).toEqual(['first', 'third']);
	});

	it('reads no entries when the address has none', () => {
		expect(entryIdsOf(new URLSearchParams())).toEqual([]);
	});
});

describe('artworksToAdd', () => {
	it('keeps the order of the album and drops the entries it does not have', () => {
		expect(
			artworksToAdd(album, ['third', 'missing', 'first']).map((artwork) => artwork.id)
		).toEqual(['first', 'third']);
	});
});
