import { describe, expect, it } from 'vitest';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { erasOfYears, groupAuthors, groupEvents } from './era-groups.ts';

const JUNCTIONS = [-3000, 476, 1492, 1789, 1945];

describe('erasOfYears', () => {
	it('places a single year in the era it falls in', () => {
		expect(erasOfYears(null, 1066, JUNCTIONS)).toEqual(['middle_ages']);
		expect(erasOfYears(null, -5000, JUNCTIONS)).toEqual(['prehistory']);
		expect(erasOfYears(null, 2001, JUNCTIONS)).toEqual(['contemporary']);
	});

	it('counts a single year on a junction as the start of the later era', () => {
		expect(erasOfYears(null, 1492, JUNCTIONS)).toEqual(['early_modern']);
	});

	it('places a span in every era it covers', () => {
		expect(erasOfYears(1760, 1840, JUNCTIONS)).toEqual(['early_modern', 'modern']);
		expect(erasOfYears(-500, 1500, JUNCTIONS)).toEqual([
			'antiquity',
			'middle_ages',
			'early_modern'
		]);
	});

	it('ends a span on a junction in the earlier era', () => {
		expect(erasOfYears(1939, 1945, JUNCTIONS)).toEqual(['modern']);
		expect(erasOfYears(1789, 1799, JUNCTIONS)).toEqual(['modern']);
	});

	it('follows the bounds the learner set', () => {
		expect(erasOfYears(null, 1470, [-3000, 476, 1453, 1789, 1945])).toEqual(['early_modern']);
	});
});

describe('groupEvents', () => {
	it('lists an event under every era it covers and leaves the others empty', () => {
		const groups = groupEvents(
			[
				{ id: 'a', yearFrom: 1760, yearTo: 1840 },
				{ id: 'b', yearFrom: null, yearTo: 1066 }
			],
			JUNCTIONS
		);

		expect(groups.map((group) => [group.code, group.records.map((event) => event.id)])).toEqual([
			['prehistory', []],
			['antiquity', []],
			['middle_ages', ['b']],
			['early_modern', ['a']],
			['modern', ['a']],
			['contemporary', []]
		]);
	});
});

describe('groupAuthors', () => {
	it('lists an author under the eras of their artworks with the count and oldest year there', () => {
		const data = testCardIndex();
		const authors = data.values.filter((value) => value.category === 'author');
		const grouped = groupAuthors(
			{
				...data,
				authorEras: [
					{ authorId: 'author-phidias', eraCode: 'antiquity', count: 1, oldestYear: -447 },
					{ authorId: 'author-phidias', eraCode: 'middle_ages', count: 2 }
				]
			},
			authors
		);

		expect(grouped.eras.find((era) => era.code === 'antiquity')?.records).toEqual([
			{ id: 'author-phidias', name: 'Phidias', count: 1, year: -447 }
		]);
		expect(grouped.eras.find((era) => era.code === 'middle_ages')?.records).toEqual([
			{ id: 'author-phidias', name: 'Phidias', count: 2 }
		]);
	});

	it('keeps an author without an artwork of an era outside the eras', () => {
		const data = testCardIndex();
		const grouped = groupAuthors(
			data,
			data.values.filter((value) => value.category === 'author')
		);

		expect(grouped.outside).toEqual([{ id: 'author-unplaced', name: 'Unplaced', count: 0 }]);
	});

	it('orders authors by their oldest artwork in the era, not by the birth year', () => {
		const data = testCardIndex();
		const grouped = groupAuthors(data, [
			{ id: 'author-phidias', category: 'author', name: 'Phidias', count: 1, birthYear: -480 }
		]);

		expect(grouped.eras.find((era) => era.code === 'antiquity')?.records[0]).not.toHaveProperty(
			'birthYear'
		);
	});
});
