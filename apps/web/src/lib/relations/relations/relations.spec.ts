import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import { artworkYears, eventsWindow, relatedGroups, typeCounts, yearsSpan } from './relations.ts';

const index: CardIndexData = {
	values: [
		{ id: 'p-ren', category: 'period', name: 'Renaissance', count: 3 },
		{ id: 'p-high', category: 'period', name: 'High Renaissance', count: 1 },
		{ id: 's-sfu', category: 'style', name: 'Sfumato', count: 2 },
		{ id: 'm-oil', category: 'material', name: 'Oil on poplar', count: 2 },
		{ id: 'l-louvre', category: 'location', name: 'Louvre', count: 1 },
		{ id: 'a-leo', category: 'author', name: 'Leonardo', count: 3 }
	],
	periodEras: [],
	stylePeriods: []
};

const artworks = [
	testArtwork(1, 'Mona Lisa', {
		yearTo: 1503,
		typeCode: 'painting',
		period: 'Renaissance',
		styles: ['Sfumato'],
		materials: ['Oil on poplar'],
		location: 'Louvre',
		authors: ['Leonardo']
	}),
	testArtwork(2, 'Annunciation', {
		yearTo: 1476,
		typeCode: 'painting',
		period: 'Renaissance',
		styles: ['Sfumato'],
		materials: ['Oil on poplar'],
		location: null,
		authors: ['Leonardo']
	}),
	testArtwork(3, 'Vitruvian Man', {
		yearTo: null,
		typeCode: 'drawing',
		period: 'High Renaissance',
		styles: [],
		materials: [],
		location: null,
		authors: ['Leonardo']
	})
];

describe('relations', () => {
	it('groups the values used together on an author page, most used first, with links', () => {
		const groups = relatedGroups('author', artworks, index);

		expect(groups.map((group) => group.label)).toEqual(['Okresy i style', 'Materiały', 'Miejsca']);
		expect(groups[0].values.map(({ name, count }) => [name, count])).toEqual([
			['Renaissance', 2],
			['Sfumato', 2],
			['High Renaissance', 1]
		]);
		expect(groups[0].values[0].href).toBe('/atelier/values/period/p-ren');
	});

	it('leaves out groups without values', () => {
		expect(relatedGroups('material', artworks.slice(2), index).map((group) => group.label)).toEqual(
			['Autorzy', 'Okresy']
		);
		expect(relatedGroups('era', [], index)).toEqual([]);
	});

	it('counts the artwork types', () => {
		expect(typeCounts(artworks)).toEqual([
			{ code: 'painting', count: 2 },
			{ code: 'drawing', count: 1 }
		]);
	});

	it('takes the dated years in order', () => {
		expect(artworkYears(artworks)).toEqual([1476, 1503]);
		expect(yearsSpan([1476, 1503])).toEqual({ from: 1476, to: 1503 });
		expect(yearsSpan([])).toBeUndefined();
	});

	it('looks for events of the same time only on pages with a time', () => {
		expect(eventsWindow('author', { from: 1452, to: 1519 }, [1476])).toEqual({
			from: 1452,
			to: 1519
		});
		expect(eventsWindow('style', undefined, [1476, 1503])).toEqual({ from: 1476, to: 1503 });
		expect(eventsWindow('style', undefined, [])).toBeUndefined();
		expect(eventsWindow('material', undefined, [1476])).toBeUndefined();
	});
});
