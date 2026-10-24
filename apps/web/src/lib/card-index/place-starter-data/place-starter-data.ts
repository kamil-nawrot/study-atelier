import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { countryName } from '#lib/catalogue/countries/countries.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';

type MuseumRow = {
	name: string;
	english_name: string | null;
	country_code: string;
};

type PlaceRow = {
	country_code: string | null;
	category_values: { name: string } | null;
};

export async function loadPlaceStarter(): Promise<PlaceStarter> {
	const [museums, places] = await Promise.all([
		supabase.from('catalogue_museums').select('name, english_name, country_code'),
		supabase
			.from('location_details')
			.select('country_code, category_values(name)')
			.not('country_code', 'is', null)
	]);
	const starter = emptyPlaceStarter();
	for (const row of (museums.data ?? []) as MuseumRow[]) {
		starter.museums.push({
			name: row.name,
			aliases: row.english_name ? [row.english_name] : [],
			note: countryName(row.country_code)
		});
	}
	for (const row of (places.data ?? []) as unknown as PlaceRow[]) {
		if (row.country_code && row.category_values) {
			starter.notes[valueKey(row.category_values.name)] = countryName(row.country_code);
		}
	}
	return starter;
}
