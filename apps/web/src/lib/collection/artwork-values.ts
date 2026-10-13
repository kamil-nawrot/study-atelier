import type { ArtworkValueRow, CategoryCode } from './types.ts';

export function valuesOf(rows: ArtworkValueRow[], category: CategoryCode): string[] {
	return rows
		.flatMap((row) =>
			row.category_values?.category_code === category
				? [{ position: row.position, name: row.category_values.name }]
				: []
		)
		.sort((a, b) => a.position - b.position)
		.map((value) => value.name);
}
