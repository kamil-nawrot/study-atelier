import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { dimensionsOf, wallHref, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';
import { applyFilter } from '#lib/wall/filter/filter.ts';
import { filterFromParams } from '#lib/wall/filter-params/filter-params.ts';
import { barsOf, cellKey, crossTableOf } from './distribution.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';

const technique: OwnFieldDefinition = {
	id: 'technique',
	name: 'Technika',
	description: null,
	kind: 'list',
	multiple: true
};

const artworks = [
	testArtwork(1, 'Kouros', {
		eraCode: 'antiquity',
		typeCode: 'sculpture',
		styles: ['Archaic', 'Greek'],
		materials: ['Marble'],
		authors: [],
		location: 'Met'
	}),
	testArtwork(2, 'Venus', {
		eraCode: 'antiquity',
		typeCode: 'sculpture',
		styles: ['Hellenistic'],
		materials: ['Marble'],
		authors: [],
		own: { technique: ['Carving', 'Polishing'] }
	}),
	testArtwork(3, 'Mona Lisa', {
		eraCode: 'early_modern',
		typeCode: 'painting',
		period: 'Renaissance',
		materials: ['Oil', 'Poplar'],
		authors: ['Leonardo'],
		own: { technique: ['Sfumato'] }
	}),
	testArtwork(4, 'Untitled', { eraCode: null, typeCode: null, authors: ['Leonardo'] })
];

const dimensions = dimensionsOf([technique]);

function dimension(key: string): Dimension {
	return dimensions.find((candidate) => candidate.key === key) as Dimension;
}

function onWall(href: string | undefined): number {
	if (!href) throw new Error('no link to the wall');
	return applyFilter(artworks, filterFromParams(new URL(href, 'http://localhost').searchParams))
		.length;
}

describe('barsOf', () => {
	it('counts an artwork with several styles under each of them', () => {
		const bars = barsOf(artworks, dimension('styles'));

		expect(bars.rows.map((row) => [row.value, row.count])).toEqual([
			['Archaic', 1],
			['Greek', 1],
			['Hellenistic', 1]
		]);
		expect(bars.none).toBe(2);
	});

	it('keeps the eras in their order and counts the artworks without one', () => {
		const bars = barsOf(artworks, dimension('eras'));

		expect(bars.rows.map((row) => row.value)).toEqual(['antiquity', 'early_modern']);
		expect(bars.none).toBe(1);
	});

	it('keeps unknown authors apart from the authors', () => {
		const bars = barsOf(artworks, dimension('authors'));

		expect(bars.rows.map((row) => [row.value, row.count])).toEqual([['Leonardo', 2]]);
		expect(bars.unknown).toBe(2);
		expect(dimension('authors').nameOf('')).toBe(m.atelier.filters.unknownAuthor);
	});

	it('counts the values of an own list field', () => {
		const bars = barsOf(artworks, dimension('own:technique'));

		expect(bars.rows.map((row) => row.value)).toEqual(['Carving', 'Polishing', 'Sfumato']);
		expect(bars.none).toBe(2);
	});

	it('puts the values past the first twelve together', () => {
		const many = Array.from({ length: 15 }, (_, index) =>
			testArtwork(index + 1, `Work ${index}`, {
				styles: [`Style ${String(index).padStart(2, '0')}`]
			})
		);

		const bars = barsOf(many, dimension('styles'));

		expect(bars.rows).toHaveLength(12);
		expect(bars.rest).toEqual({ values: 3, count: 3 });
	});
});

describe('the numbers and the wall', () => {
	it('opens the wall on as many artworks as each bar counts', () => {
		for (const each of dimensions) {
			const bars = barsOf(artworks, each);
			for (const row of bars.rows) {
				expect(onWall(wallHref(each.filterOf(row.value))), `${each.key} ${row.value}`).toBe(
					row.count
				);
			}
			if (bars.unknown > 0) expect(onWall(wallHref(each.filterOf('')))).toBe(bars.unknown);
			if (each.noneFilter)
				expect(onWall(wallHref(each.noneFilter)), `${each.key} none`).toBe(bars.none);
		}
	});

	it('keeps both own fields when a cell crosses two of them', () => {
		const source: OwnFieldDefinition = { ...technique, id: 'source', name: 'Źródło' };
		const crossed = [
			testArtwork(1, 'A', { own: { technique: ['Carving'], source: ['Book'] } }),
			testArtwork(2, 'B', { own: { technique: ['Carving'], source: ['Film'] } }),
			testArtwork(3, 'C', { own: { technique: ['Painting'], source: ['Book'] } })
		];
		const both = dimensionsOf([technique, source]);
		const rows = both.find((each) => each.key === 'own:technique') as Dimension;
		const columns = both.find((each) => each.key === 'own:source') as Dimension;
		const href = wallHref(rows.filterOf('Carving'), columns.filterOf('Book')) as string;

		expect(
			applyFilter(crossed, filterFromParams(new URL(href, 'http://localhost').searchParams))
		).toHaveLength(1);
	});

	it('opens the wall on as many artworks as each cell of a table counts', () => {
		const table = crossTableOf(artworks, dimension('types'), dimension('materials'));
		for (const row of table.rows) {
			for (const column of table.columns) {
				const count = table.cells.get(cellKey(row.value, column.value)) ?? 0;
				const href = wallHref(
					dimension('types').filterOf(row.value),
					dimension('materials').filterOf(column.value)
				);
				expect(onWall(href), `${row.value} ${column.value}`).toBe(count);
			}
		}
	});
});
