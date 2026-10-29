import { describe, expect, it } from 'vitest';
import { valuesOf } from './artwork-values.ts';
import type { ArtworkValueRow } from '#lib/card-index/types/artwork-value-row.ts';

function value(category: string, name: string, position: number): ArtworkValueRow {
	return { position, category_values: { category_code: category, name } };
}

describe('valuesOf', () => {
	it('lists the names of one category in the order of their positions', () => {
		const rows = [
			value('author', 'Second Author', 1),
			value('style', 'Baroque', 0),
			value('author', 'First Author', 0)
		];

		expect(valuesOf(rows, 'author')).toEqual(['First Author', 'Second Author']);
	});

	it('ignores rows without a value', () => {
		const rows: ArtworkValueRow[] = [
			{ position: 0, category_values: null },
			value('style', 'Baroque', 1)
		];

		expect(valuesOf(rows, 'style')).toEqual(['Baroque']);
	});

	it('returns nothing for a category the artwork has no values in', () => {
		expect(valuesOf([value('author', 'Someone', 0)], 'material')).toEqual([]);
	});

	it('does not change the rows it is given', () => {
		const rows = [value('author', 'B', 1), value('author', 'A', 0)];

		valuesOf(rows, 'author');

		expect(rows.map((row) => row.position)).toEqual([1, 0]);
	});
});
