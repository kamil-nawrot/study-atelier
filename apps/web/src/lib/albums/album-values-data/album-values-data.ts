import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { albumValueNames } from '#lib/albums/album-values/album-values.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import type { LearnerValue } from '#lib/albums/types/learner-value.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

type LearnerValuesResult = { values: LearnerValue[]; error?: string };

type NameRow = { category_code: string; name: string };

type DetailsRow = { wikidata: string | null; category_values: { name: string } | null };

type Answer<T> = { data: T[] | null; error: { message: string; code?: string } | null };

const LIKE_SPECIAL = /[\\%_]/g;

export function exactLike(name: string): string {
	return name.trim().replace(LIKE_SPECIAL, (character) => `\\${character}`);
}

function byName(category: CategoryCode, name: string): PromiseLike<Answer<NameRow>> {
	return supabase
		.from('category_values')
		.select('category_code, name')
		.eq('category_code', category)
		.ilike('name', exactLike(name));
}

function authorsById(ids: string[]): PromiseLike<Answer<DetailsRow>> {
	return supabase
		.from('author_details')
		.select(
			'wikidata:source_wikidata_id, category_values!author_details_value_id_owner_id_category_code_fkey(name)'
		)
		.in('source_wikidata_id', ids);
}

function placesById(ids: string[]): PromiseLike<Answer<DetailsRow>> {
	return supabase
		.from('location_details')
		.select(
			'wikidata:wikidata_id, category_values!location_details_value_id_owner_id_category_code_fkey(name)'
		)
		.in('wikidata_id', ids);
}

function wikidataIds(values: readonly AlbumValue[], category: CategoryCode): string[] {
	return values.flatMap((value) =>
		value.category === category && value.wikidataId ? [value.wikidataId] : []
	);
}

function detailsValues(category: CategoryCode, rows: DetailsRow[]): LearnerValue[] {
	return rows.flatMap((row) =>
		row.category_values
			? [{ category, name: row.category_values.name, wikidataId: row.wikidata }]
			: []
	);
}

export async function loadLearnerValues(
	values: readonly AlbumValue[]
): Promise<LearnerValuesResult> {
	const names = values.flatMap((value) =>
		albumValueNames(value).map((name) => byName(value.category, name))
	);
	const authors = wikidataIds(values, 'author');
	const places = wikidataIds(values, 'location');
	const [named, byAuthor, byPlace] = await Promise.all([
		Promise.all(names),
		authors.length > 0 ? authorsById(authors) : { data: [], error: null },
		places.length > 0 ? placesById(places) : { data: [], error: null }
	]);
	const error = [...named, byAuthor, byPlace].find((answer) => answer.error)?.error;
	if (error) return { values: [], error: collectionErrorMessage(error) };
	return {
		values: [
			...detailsValues('author', byAuthor.data ?? []),
			...detailsValues('location', byPlace.data ?? []),
			...named.flatMap((answer) =>
				(answer.data ?? []).map((row) => ({
					category: row.category_code as CategoryCode,
					name: row.name,
					wikidataId: null
				}))
			)
		]
	};
}
