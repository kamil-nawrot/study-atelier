import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { groupByEra } from './periods.ts';
import type { EraCode } from './types.ts';

function artwork(
	number: number,
	year: number | null,
	eraCode: EraCode | null
): ReturnType<typeof testArtwork> {
	return testArtwork(number, `Artwork ${number}`, { yearTo: year, eraCode });
}

function numbers(groups: ReturnType<typeof groupByEra>): number[][] {
	return groups.map((group) => group.artworks.map((item) => item.number));
}

describe('groupByEra', () => {
	it('keeps the eras in their fixed order whatever the years of the artworks are', () => {
		const groups = groupByEra([
			artwork(1, 1990, 'contemporary'),
			artwork(2, -300, 'antiquity'),
			artwork(3, 1880, 'modern'),
			artwork(4, 1500, 'early_modern'),
			artwork(5, 1100, 'middle_ages'),
			artwork(6, -30000, 'prehistory')
		]);

		expect(groups.map((group) => group.code)).toEqual([
			'prehistory',
			'antiquity',
			'middle_ages',
			'early_modern',
			'modern',
			'contemporary'
		]);
	});

	it('names each group after its era', () => {
		const [group] = groupByEra([artwork(1, 1500, 'early_modern')]);

		expect(group.name).toBe(m.eras.early_modern.name);
	});

	it('leaves out an era without artworks', () => {
		const groups = groupByEra([artwork(1, 1880, 'modern'), artwork(2, -300, 'antiquity')]);

		expect(groups.map((group) => group.code)).toEqual(['antiquity', 'modern']);
	});

	it('orders artworks by year inside an era', () => {
		const groups = groupByEra([
			artwork(1, 1880, 'modern'),
			artwork(2, 1800, 'modern'),
			artwork(3, 1860, 'modern')
		]);

		expect(numbers(groups)).toEqual([[2, 3, 1]]);
	});

	it('takes the bounds of an era from its artworks', () => {
		const [group] = groupByEra([
			artwork(1, -450, 'antiquity'),
			artwork(2, -300, 'antiquity'),
			artwork(3, null, 'antiquity')
		]);

		expect(group.from).toBe(-450);
		expect(group.to).toBe(-300);
	});

	it('gives an era without dated artworks no bounds', () => {
		const [group] = groupByEra([artwork(1, null, 'modern')]);

		expect(group.from).toBeNull();
		expect(group.to).toBeNull();
	});

	it('keeps equal years in record number order and puts artworks without a year at the end', () => {
		const [group] = groupByEra([
			artwork(5, null, 'early_modern'),
			artwork(4, 1650, 'early_modern'),
			artwork(2, 1650, 'early_modern'),
			artwork(3, null, 'early_modern'),
			artwork(1, 1600, 'early_modern')
		]);

		expect(group.artworks.map((item) => item.number)).toEqual([1, 2, 4, 3, 5]);
	});

	it('leaves out artworks without an era', () => {
		const groups = groupByEra([artwork(1, 1500, null), artwork(2, 1500, 'early_modern')]);

		expect(numbers(groups)).toEqual([[2]]);
	});

	it('returns nothing for an empty list', () => {
		expect(groupByEra([])).toEqual([]);
	});
});
