import { describe, expect, it } from 'vitest';
import {
	albumEntryOf,
	compareAlbumHref,
	compareHref,
	sidesOf,
	swapped
} from './compare-address.ts';

describe('sidesOf', () => {
	it('reads both record numbers', () => {
		expect(sidesOf(new URLSearchParams('left=42&right=7'))).toEqual({ left: 42, right: 7 });
	});

	it('leaves a missing or invalid number empty', () => {
		expect(sidesOf(new URLSearchParams('right=7'))).toEqual({ left: null, right: 7 });
		expect(sidesOf(new URLSearchParams('left=abc&right=0'))).toEqual({ left: null, right: null });
		expect(sidesOf(new URLSearchParams(''))).toEqual({ left: null, right: null });
	});
});

describe('compareHref', () => {
	it('writes the numbers that are set', () => {
		expect(compareHref({ left: 42, right: 7 })).toBe('/atelier/compare?left=42&right=7');
		expect(compareHref({ left: null, right: 7 })).toBe('/atelier/compare?right=7');
	});

	it('writes no query for an empty comparison', () => {
		expect(compareHref({ left: null, right: null })).toBe('/atelier/compare');
	});
});

describe('swapped', () => {
	it('exchanges the halves', () => {
		expect(swapped({ left: 42, right: null })).toEqual({ left: null, right: 42 });
	});
});

describe('the album version of an artwork', () => {
	it('writes the artwork and the album entry and reads the entry back', () => {
		const href = compareAlbumHref(3, { slug: 'sample-album', entryId: 'spiral-study' });

		expect(href).toBe('/atelier/compare?left=3&album=sample-album%2Fspiral-study');
		expect(albumEntryOf(new URL(href, 'https://app.test').searchParams)).toEqual({
			slug: 'sample-album',
			entryId: 'spiral-study'
		});
	});

	it('reads no entry from a missing or malformed parameter', () => {
		expect(albumEntryOf(new URLSearchParams('left=3'))).toBeNull();
		expect(albumEntryOf(new URLSearchParams('album=../x'))).toBeNull();
	});
});
