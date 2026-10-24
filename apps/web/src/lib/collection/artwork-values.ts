import { isCategoryCode } from './category-values.ts';
import type { ArtworkValueRow, FieldEntryRow } from './types.ts';
import type { OwnEntries } from '#lib/catalogue/types/own-entries.ts';

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

export function ownEntriesOf(values: ArtworkValueRow[], entries: FieldEntryRow[] = []): OwnEntries {
	const lists = new Set(
		values.flatMap((value) => {
			const code = value.category_values?.category_code;
			return code && !isCategoryCode(code) ? [code] : [];
		})
	);
	return {
		...Object.fromEntries([...lists].map((code) => [code, valuesOf(values, code)])),
		...Object.fromEntries(entries.map((entry) => [entry.field_id, entry.text_value ?? true]))
	};
}
