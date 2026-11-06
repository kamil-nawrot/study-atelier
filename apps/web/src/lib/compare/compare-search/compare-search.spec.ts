import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { filterForComparison } from './compare-search.ts';

function artwork(number: number, title: string, authors: string[]): WallArtwork {
	return {
		id: `artwork-${number}`,
		number,
		title,
		authors,
		yearFrom: null,
		yearTo: null,
		eraCode: null,
		typeCode: null,
		period: null,
		styles: [],
		materials: [],
		location: null,
		hasImage: false,
		favourite: false
	};
}

const ARTWORKS = [
	artwork(1, 'Mona Lisa', ['Leonardo da Vinci']),
	artwork(12, 'The Birth of Venus', ['Sandro Botticelli']),
	artwork(112, 'Łaźnia', ['Józef Mehoffer'])
];

describe('filterForComparison', () => {
	it('keeps every artwork without a query', () => {
		expect(filterForComparison(ARTWORKS, '  ')).toHaveLength(3);
	});

	it('finds by title or author, ignoring case and diacritics', () => {
		expect(filterForComparison(ARTWORKS, 'venus').map((item) => item.number)).toEqual([12]);
		expect(filterForComparison(ARTWORKS, 'vinci').map((item) => item.number)).toEqual([1]);
		expect(filterForComparison(ARTWORKS, 'jozef').map((item) => item.number)).toEqual([112]);
		expect(filterForComparison(ARTWORKS, 'lazn').map((item) => item.number)).toEqual([112]);
	});

	it('finds by record number, with or without the hash and zeros', () => {
		expect(filterForComparison(ARTWORKS, '12').map((item) => item.number)).toEqual([12]);
		expect(filterForComparison(ARTWORKS, '#0012').map((item) => item.number)).toEqual([12]);
	});

	it('leaves out the artworks already compared', () => {
		expect(filterForComparison(ARTWORKS, '', [1, null]).map((item) => item.number)).toEqual([
			12, 112
		]);
	});

	it('returns nothing when nothing matches', () => {
		expect(filterForComparison(ARTWORKS, 'zzz')).toEqual([]);
	});
});
