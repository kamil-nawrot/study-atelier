import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/testing/artworks.ts';
import { authorSortKeys, compareSortKeys, sortKeyOf } from './author-sort.ts';

describe('author sort keys', () => {
	it('uses the sort name of an author and the name of one without it', () => {
		const keys = authorSortKeys([
			testArtwork(1, 'Mona Lisa', {
				authors: ['Leonardo da Vinci', 'Workshop'],
				authorSortNames: ['Vinci, Leonardo da', null]
			}),
			testArtwork(2, 'Soup Cans', { authors: ['Andy Warhol'] })
		]);

		expect(sortKeyOf('Leonardo da Vinci', keys)).toBe('Vinci, Leonardo da');
		expect(sortKeyOf('Workshop', keys)).toBe('Workshop');
		expect(sortKeyOf('Andy Warhol', keys)).toBe('Andy Warhol');
		expect(sortKeyOf('Nobody', keys)).toBe('Nobody');
	});

	it('keeps a sort name found on any artwork of the author', () => {
		const keys = authorSortKeys([
			testArtwork(1, 'One', { authors: ['Klimt'], authorSortNames: [null] }),
			testArtwork(2, 'Two', { authors: ['Klimt'], authorSortNames: ['Klimt, Gustav'] }),
			testArtwork(3, 'Three', { authors: ['Klimt'], authorSortNames: [null] })
		]);

		expect(sortKeyOf('Klimt', keys)).toBe('Klimt, Gustav');
	});

	it('compares in Polish alphabetical order', () => {
		expect(compareSortKeys('Łukasz', 'Lukas')).toBeGreaterThan(0);
		expect(compareSortKeys('Łukasz', 'Mateusz')).toBeLessThan(0);
	});
});
