import { locale } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';
import {
	CATEGORY_CODES,
	isCategoryCode,
	emptyCategoryValues
} from '#lib/card-index/category-values/category-values.ts';

type CategoryValuesResult = {
	values: CategoryValues;
	ownValues: Record<string, string[]>;
	error?: string;
};

type CategoryValueRow = {
	category_code: string;
	name: string;
};

type ArtworkValuesRow = {
	artwork_values: { category_values: CategoryValueRow | null }[];
};

type VisitPlaceRow = {
	category_values: { name: string } | null;
};

type VisitPlacesResult = {
	places: string[];
	error?: string;
};

export async function loadVisitPlaces(): Promise<VisitPlacesResult> {
	const { data, error } = await supabase.from('visits').select('category_values(name)');
	if (error) return { places: [], error: collectionErrorMessage(error) };
	const names = ((data ?? []) as unknown as VisitPlaceRow[]).flatMap(
		(row) => row.category_values?.name ?? []
	);
	return { places: [...new Set(names)] };
}

export async function loadCategoryValues(): Promise<CategoryValuesResult> {
	const [{ data, error }, visits] = await Promise.all([
		supabase
			.from('artworks')
			.select('artwork_values(category_values(category_code, name))')
			.is('deleted_at', null),
		loadVisitPlaces()
	]);
	const failure = error ? collectionErrorMessage(error) : visits.error;
	if (failure) return { values: emptyCategoryValues(), ownValues: {}, error: failure };

	const names = new Map<string, Set<string>>([['location', new Set(visits.places)]]);
	for (const row of (data ?? []) as unknown as ArtworkValuesRow[]) {
		for (const { category_values: value } of row.artwork_values) {
			if (!value) continue;
			const set = names.get(value.category_code) ?? new Set<string>();
			set.add(value.name);
			names.set(value.category_code, set);
		}
	}

	const sorted = (code: string): string[] =>
		[...(names.get(code) ?? [])].sort((a, b) => a.localeCompare(b, locale));
	const values = emptyCategoryValues();
	for (const category of CATEGORY_CODES) values[category] = sorted(category);
	const ownValues = Object.fromEntries(
		[...names.keys()].filter((code) => !isCategoryCode(code)).map((code) => [code, sorted(code)])
	);
	return { values, ownValues };
}
