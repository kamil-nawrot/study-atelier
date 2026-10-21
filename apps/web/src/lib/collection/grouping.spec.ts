import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import {
	allocateTiles,
	groupingFromParams,
	groupWall,
	orderWall,
	railGroups,
	sectionKeys,
	sectionSequence,
	wallParams
} from './grouping.ts';
import type { WallArtwork, WallSection } from './types.ts';

function artwork(number: number, overrides: Partial<WallArtwork> = {}): WallArtwork {
	return testArtwork(number, `Artwork ${number}`, overrides);
}

function names(sections: WallSection[]): string[] {
	return sections.map((section) => section.name);
}

function numbers(section: WallSection): number[] {
	return section.artworks.map((item) => item.number);
}

describe('groupWall', () => {
	it('leaves the wall whole without grouping', () => {
		expect(groupWall([artwork(1, { eraCode: 'antiquity' })], 'none')).toEqual([]);
	});

	it('puts the eras in their fixed order and the artworks without an era last', () => {
		const sections = groupWall(
			[
				artwork(1, { eraCode: 'modern' }),
				artwork(2),
				artwork(3, { eraCode: 'prehistory' }),
				artwork(4, { eraCode: 'modern' })
			],
			'era'
		);

		expect(names(sections)).toEqual(['prehistoria', 'nowoczesność', m.atelier.grouping.noEra]);
		expect(sections.map((section) => section.code)).toEqual(['prehistory', 'modern', null]);
		expect(numbers(sections[1])).toEqual([1, 4]);
		expect(sections.every((section) => section.sections.length === 0)).toBe(true);
	});

	it('orders the periods of an era by their earliest artwork, then by name', () => {
		const [era] = groupWall(
			[
				artwork(1, { eraCode: 'early_modern', period: 'barok', yearTo: 1650 }),
				artwork(2, { eraCode: 'early_modern', period: 'renesans', yearTo: 1600 }),
				artwork(3, { eraCode: 'early_modern', period: 'renesans', yearFrom: 1420, yearTo: 1430 }),
				artwork(4, { eraCode: 'early_modern', period: 'manieryzm', yearTo: null }),
				artwork(5, { eraCode: 'early_modern', period: 'klasycyzm', yearTo: null }),
				artwork(6, { eraCode: 'early_modern', yearTo: 1500 })
			],
			'period'
		);

		expect(names(era.sections)).toEqual([
			'renesans',
			'barok',
			'klasycyzm',
			'manieryzm',
			m.atelier.grouping.noPeriod
		]);
	});

	it('repeats an artwork in each of its styles and keeps the missing groups without levels below', () => {
		const sections = groupWall(
			[
				artwork(1, {
					eraCode: 'early_modern',
					period: 'barok',
					styles: ['caravaggionizm', 'barok']
				}),
				artwork(2, { eraCode: 'early_modern', period: 'barok' }),
				artwork(3, { eraCode: 'early_modern' }),
				artwork(4)
			],
			'style'
		);

		const [era, noEra] = sections;
		const [period, noPeriod] = era.sections;
		expect(names(period.sections)).toEqual(['barok', 'caravaggionizm', m.atelier.grouping.noStyle]);
		expect(period.sections.map(numbers)).toEqual([[1], [1], [2]]);
		expect(numbers(period)).toEqual([1, 2]);
		expect(noPeriod.sections).toEqual([]);
		expect(noEra.sections).toEqual([]);
		expect(new Set(sectionKeys(sections)).size).toBe(sectionKeys(sections).length);
	});

	it('keeps the order of the wall inside each group', () => {
		const [era] = groupWall(
			orderWall(
				[
					artwork(1, { eraCode: 'antiquity', yearTo: -100 }),
					artwork(2, { eraCode: 'antiquity', yearTo: -500 })
				],
				'year'
			),
			'era'
		);

		expect(numbers(era)).toEqual([2, 1]);
	});
});

describe('orderWall', () => {
	const artworks = [
		artwork(1, { authors: ['Vermeer'], yearTo: 1660 }),
		artwork(2, { authors: ['Caravaggio'], yearTo: 1600 }),
		artwork(3, { authors: ['Rembrandt'], yearTo: null })
	];

	it('keeps the most recently added first', () => {
		expect(orderWall(artworks, 'recent').map((item) => item.number)).toEqual([1, 2, 3]);
	});

	it('orders by the date of creation, artworks without a year last', () => {
		expect(orderWall(artworks, 'year').map((item) => item.number)).toEqual([2, 1, 3]);
	});

	it('keeps equal years in record number order and orders a year span by its end', () => {
		const ordered = orderWall(
			[
				artwork(5, { yearTo: null }),
				artwork(4, { yearTo: 1650 }),
				artwork(2, { yearTo: 1650 }),
				artwork(3, { yearFrom: 1400, yearTo: 1660 }),
				artwork(1, { yearTo: 1600 })
			],
			'year'
		);

		expect(ordered.map((item) => item.number)).toEqual([1, 2, 4, 3, 5]);
	});

	it('orders by author', () => {
		expect(orderWall(artworks, 'author').map((item) => item.number)).toEqual([2, 3, 1]);
	});
});

describe('sectionSequence', () => {
	it('follows the groups and lists a repeated artwork once, where it first appears', () => {
		const sections = groupWall(
			[
				artwork(1, { eraCode: 'modern', period: 'XIX wiek', styles: ['realizm', 'romantyzm'] }),
				artwork(2, { eraCode: 'modern', period: 'XIX wiek', styles: ['romantyzm'], yearTo: 1800 }),
				artwork(3, { eraCode: 'antiquity' })
			],
			'style'
		);

		expect(sectionSequence(sections).map((item) => item.number)).toEqual([3, 1, 2]);
	});
});

describe('allocateTiles', () => {
	const sections = groupWall(
		[
			artwork(1, { eraCode: 'prehistory' }),
			artwork(2, { eraCode: 'prehistory' }),
			artwork(3, { eraCode: 'antiquity' }),
			artwork(4, { eraCode: 'antiquity' }),
			artwork(5, { eraCode: 'modern' })
		],
		'era'
	);
	const [prehistory, antiquity, modern] = sections.map((section) => section.key);

	it('shares one budget of tiles between the groups in order', () => {
		const budget = allocateTiles(sections, new Set(), 3);

		expect([...budget.shown]).toEqual([
			[prehistory, 2],
			[antiquity, 1]
		]);
		expect(budget.complete).toBe(false);
	});

	it('spends nothing on a collapsed group', () => {
		const budget = allocateTiles(sections, new Set([antiquity]), 3);

		expect([...budget.shown]).toEqual([
			[prehistory, 2],
			[antiquity, 0],
			[modern, 1]
		]);
		expect(budget.complete).toBe(true);
	});
});

describe('wall params', () => {
	it('adds the grouping to the filter and reads it back', () => {
		const params = wallParams(new URLSearchParams('era=antiquity'), 'period');

		expect(params.toString()).toBe('era=antiquity&group=period');
		expect(groupingFromParams(params)).toBe('period');
	});

	it('leaves the grouping out when the wall is not grouped, and ignores an unknown value', () => {
		expect(wallParams(new URLSearchParams(), 'none').toString()).toBe('');
		expect(groupingFromParams(new URLSearchParams('group=author'))).toBe('none');
		expect(groupingFromParams(new URLSearchParams('grupuj=epoka'))).toBe('none');
		expect(groupingFromParams(new URLSearchParams())).toBe('none');
	});
});

describe('railGroups', () => {
	it('names the top groups with the years of their artworks', () => {
		const groups = railGroups(
			groupWall(
				[
					artwork(1, { eraCode: 'antiquity', yearFrom: -530, yearTo: -520 }),
					artwork(2, { eraCode: 'antiquity', yearTo: -228 })
				],
				'period'
			)
		);

		expect(groups.map(({ code, name, from, to }) => ({ code, name, from, to }))).toEqual([
			{ code: 'antiquity', name: 'starożytność', from: -530, to: -228 }
		]);
	});
});
