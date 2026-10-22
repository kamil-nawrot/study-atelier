import type { ArtworkValueRow } from './types.ts';

export function authorSortNamesOf(rows: ArtworkValueRow[]): (string | null)[] {
	return rows
		.flatMap((row) =>
			row.category_values?.category_code === 'author'
				? [
						{
							position: row.position,
							sortName: row.category_values.author_details?.[0]?.sort_name ?? null
						}
					]
				: []
		)
		.sort((a, b) => a.position - b.position)
		.map((value) => value.sortName);
}

export function valuesOf(rows: ArtworkValueRow[], category: string): string[] {
	return rows
		.flatMap((row) =>
			row.category_values?.category_code === category
				? [{ position: row.position, name: row.category_values.name }]
				: []
		)
		.sort((a, b) => a.position - b.position)
		.map((value) => value.name);
}
