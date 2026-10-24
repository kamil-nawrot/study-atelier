import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { groupByAuthor } from './periods.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

function numbers(groups: ReturnType<typeof groupByAuthor>): number[][] {
	return groups.map((group) => group.artworks.map((item) => item.number));
}

describe('groupByAuthor', () => {
	function byAuthors(number: number, authors: string[], year: number | null = 1900): WallArtwork {
		return testArtwork(number, `Artwork ${number}`, { authors, yearTo: year });
	}

	it('orders authors by their sort name when they have one', () => {
		const groups = groupByAuthor([
			testArtwork(1, 'Mona Lisa', {
				authors: ['Leonardo da Vinci'],
				authorSortNames: ['Vinci, Leonardo da']
			}),
			testArtwork(2, 'Soup Cans', { authors: ['Andy Warhol'], authorSortNames: ['Warhol, Andy'] }),
			testArtwork(3, 'The Kiss', { authors: ['Gustav Klimt'], authorSortNames: ['Klimt, Gustav'] })
		]);

		expect(groups.map((group) => group.name)).toEqual([
			'Gustav Klimt',
			'Leonardo da Vinci',
			'Andy Warhol'
		]);
	});

	it('makes one block per first author, A to Z with Polish letters in place', () => {
		const groups = groupByAuthor([
			byAuthors(1, ['Zofia Stryjeńska']),
			byAuthors(2, ['Łukasz Painter']),
			byAuthors(3, ['Leon Wyczółkowski']),
			byAuthors(4, ['Albrecht Dürer', 'Zofia Stryjeńska'])
		]);

		expect(groups.map((group) => group.name)).toEqual([
			'Albrecht Dürer',
			'Leon Wyczółkowski',
			'Łukasz Painter',
			'Zofia Stryjeńska'
		]);
		expect(numbers(groups)).toEqual([[4], [3], [2], [1]]);
	});

	it('puts artworks without an author in a last block named unknown author', () => {
		const groups = groupByAuthor([byAuthors(1, []), byAuthors(2, ['Albrecht Dürer'])]);

		expect(groups.map((group) => group.name)).toEqual([
			'Albrecht Dürer',
			m.atelier.filters.unknownAuthor
		]);
		expect(groups.map((group) => group.code)).toEqual([null, null]);
	});

	it('gives every block a distinct key, also when an author is named like the unknown block', () => {
		const groups = groupByAuthor([
			byAuthors(1, []),
			byAuthors(2, [m.atelier.filters.unknownAuthor])
		]);

		expect(new Set(groups.map((group) => group.key)).size).toBe(2);
	});

	it('orders artworks by year inside a block, without a year last, and takes the bounds from them', () => {
		const [group] = groupByAuthor([
			byAuthors(1, ['Albrecht Dürer'], 1514),
			byAuthors(2, ['Albrecht Dürer'], null),
			byAuthors(3, ['Albrecht Dürer'], 1500)
		]);

		expect(group.artworks.map((item) => item.number)).toEqual([3, 1, 2]);
		expect(group.from).toBe(1500);
		expect(group.to).toBe(1514);
	});

	it('returns nothing for an empty list', () => {
		expect(groupByAuthor([])).toEqual([]);
	});
});
