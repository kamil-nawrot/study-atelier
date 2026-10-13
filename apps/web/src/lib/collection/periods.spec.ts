import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/testing/artworks.ts';
import { groupByPeriod } from './periods.ts';

function artwork(
	number: number,
	year: number | null,
	periods: string[]
): ReturnType<typeof testArtwork> {
	return testArtwork(number, `Artwork ${number}`, { year, periods });
}

function numbers(groups: ReturnType<typeof groupByPeriod>): number[][] {
	return groups.map((group) => group.artworks.map((item) => item.number));
}

describe('groupByPeriod', () => {
	it('orders periods by their lowest year and artworks by year inside a period', () => {
		const groups = groupByPeriod([
			artwork(1, 1880, ['Impressionism']),
			artwork(2, 1500, ['Renaissance']),
			artwork(3, 1860, ['Impressionism']),
			artwork(4, 1480, ['Renaissance'])
		]);

		expect(groups.map((group) => group.name)).toEqual(['Renaissance', 'Impressionism']);
		expect(numbers(groups)).toEqual([
			[4, 2],
			[3, 1]
		]);
	});

	it('takes the bounds of a period from its artworks', () => {
		const [group] = groupByPeriod([
			artwork(1, -450, ['Classical']),
			artwork(2, -300, ['Classical']),
			artwork(3, null, ['Classical'])
		]);

		expect(group.from).toBe(-450);
		expect(group.to).toBe(-300);
	});

	it('places a period without dated artworks last, with no bounds', () => {
		const groups = groupByPeriod([
			artwork(1, null, ['Undated']),
			artwork(2, 1900, ['Modernism']),
			artwork(3, null, ['Another undated'])
		]);

		expect(groups.map((group) => group.name)).toEqual(['Modernism', 'Another undated', 'Undated']);
		expect(groups[1].from).toBeNull();
		expect(groups[1].to).toBeNull();
	});

	it('keeps equal years in record number order and puts artworks without a year at the end', () => {
		const [group] = groupByPeriod([
			artwork(5, null, ['Baroque']),
			artwork(4, 1650, ['Baroque']),
			artwork(2, 1650, ['Baroque']),
			artwork(3, null, ['Baroque']),
			artwork(1, 1600, ['Baroque'])
		]);

		expect(group.artworks.map((item) => item.number)).toEqual([1, 2, 4, 3, 5]);
	});

	it('places an artwork once, by its first period', () => {
		const groups = groupByPeriod([artwork(1, 1500, ['Renaissance', 'Mannerism'])]);

		expect(groups.map((group) => group.name)).toEqual(['Renaissance']);
	});

	it('leaves out artworks without a period', () => {
		const groups = groupByPeriod([artwork(1, 1500, []), artwork(2, 1500, ['Renaissance'])]);

		expect(numbers(groups)).toEqual([[2]]);
	});

	it('returns nothing for an empty list', () => {
		expect(groupByPeriod([])).toEqual([]);
	});
});
