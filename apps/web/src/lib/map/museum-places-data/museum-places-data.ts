import { cacheKeys, cached } from '#lib/shared/data/data-cache/data-cache.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ServiceError } from '#lib/shared/types/service-error.ts';
import type { MuseumPlace } from '#lib/map/types/museum-place.ts';

type MuseumRow = {
	wikidata_id: string;
	name: string;
	alias: string | null;
	country_code: string;
	latitude: number;
	longitude: number;
};

async function fetchMuseumPlaces(): Promise<{ rows: MuseumPlace[]; error?: ServiceError }> {
	const { rows, error } = await fetchAll<MuseumRow>((from, to) =>
		supabase
			.from('catalogue_museums')
			.select('wikidata_id, name, alias, country_code, latitude, longitude')
			.order('wikidata_id')
			.range(from, to)
	);
	return {
		rows: rows.map((row) => ({
			wikidataId: row.wikidata_id,
			name: row.name,
			alias: row.alias,
			countryCode: row.country_code,
			point: { latitude: row.latitude, longitude: row.longitude }
		})),
		error
	};
}

export async function loadMuseumPlaces(): Promise<MuseumPlace[]> {
	const result = await cached(cacheKeys.museumPoints, fetchMuseumPlaces);
	return result.error ? [] : result.rows;
}
