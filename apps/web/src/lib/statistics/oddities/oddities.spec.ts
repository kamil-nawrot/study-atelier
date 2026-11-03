import { describe, expect, it } from 'vitest';
import { ARTWORK_TYPE_CODES } from '#lib/catalogue/artwork-types/artwork-types.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { odditiesOf } from './oddities.ts';

const work = testArtwork;

describe('odditiesOf', () => {
	it('finds the oldest by its first year and the newest by its last year', () => {
		const oddities = odditiesOf(
			[
				work(1, 'Venus', { yearFrom: null, yearTo: -25000 }),
				work(2, 'Cathedral', { yearFrom: 1248, yearTo: 1880 }),
				work(3, 'Hall', { yearFrom: null, yearTo: 2017 })
			],
			ARTWORK_TYPE_CODES
		);

		expect(oddities.oldest?.artwork.title).toBe('Venus');
		expect(oddities.newest?.artwork.title).toBe('Hall');
		expect(oddities.longestBuilt?.artwork.title).toBe('Cathedral');
		expect(oddities.longestBuilt?.value).toBe(632);
	});

	it('waits for two dated artworks and a span of ten years', () => {
		const oddities = odditiesOf(
			[work(1, 'Short', { yearFrom: 1500, yearTo: 1505 }), work(2, 'Undated', { yearTo: null })],
			ARTWORK_TYPE_CODES
		);

		expect(oddities.oldest).toBeUndefined();
		expect(oddities.longestBuilt).toBeUndefined();
	});

	it('shows the first tied artwork by record number and counts the others', () => {
		const oddities = odditiesOf(
			[
				work(2, 'Second', { yearTo: 1500 }),
				work(1, 'First', { yearTo: 1500 }),
				work(3, 'Later', { yearTo: 1600 })
			],
			ARTWORK_TYPE_CODES
		);

		expect(oddities.oldest?.artwork.title).toBe('First');
		expect(oddities.oldest?.tied).toBe(1);
	});

	it('finds the most versatile author, by artworks and then by name among the tied', () => {
		const oddities = odditiesOf(
			[
				work(1, 'Pietà', { authors: ['Michelangelo'], typeCode: 'sculpture' }),
				work(2, 'Doni Tondo', { authors: ['Michelangelo'], typeCode: 'painting' }),
				work(3, 'Study', { authors: ['Michelangelo'], typeCode: 'drawing' }),
				work(4, 'Rhinoceros', { authors: ['Dürer'], typeCode: 'printmaking' }),
				work(5, 'Hare', { authors: ['Dürer'], typeCode: 'drawing' }),
				work(6, 'Adam', { authors: ['Dürer'], typeCode: 'painting' }),
				work(7, 'Lisa', { authors: ['Leonardo'], typeCode: 'painting' })
			],
			ARTWORK_TYPE_CODES
		);

		expect(oddities.versatile?.author).toBe('Dürer');
		expect(oddities.versatile?.tied).toBe(1);
		expect(oddities.versatile?.types).toEqual(['painting', 'drawing', 'printmaking']);
	});

	it('finds the author with the most materials from three', () => {
		const few = odditiesOf(
			[work(1, 'A', { authors: ['X'], materials: ['Oil', 'Canvas'] })],
			ARTWORK_TYPE_CODES
		);
		const many = odditiesOf(
			[
				work(1, 'A', { authors: ['X'], materials: ['Oil', 'Canvas'] }),
				work(2, 'B', { authors: ['X'], materials: ['Oil', 'Panel'] })
			],
			ARTWORK_TYPE_CODES
		);

		expect(few.materials).toBeUndefined();
		expect(many.materials).toEqual({ author: 'X', value: 3, tied: 0 });
	});
});
