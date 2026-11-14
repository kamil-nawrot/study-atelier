import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { isPlaceType } from '#lib/catalogue/place-types/place-types.ts';
import { m } from '#lib/i18n/i18n.ts';
import { errorMessages } from '#lib/shared/data/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

type DetailsRow = {
	place_type: string | null;
	country_code: string | null;
	latitude: number | null;
	longitude: number | null;
	city_id?: string | null;
};

type PlaceRow = {
	id: string;
	name: string;
	location_details: DetailsRow | DetailsRow[] | null;
};

const loadErrorMessage = errorMessages({}, m.map.loadError);

function detailsOf(row: PlaceRow): DetailsRow | null {
	const details = row.location_details;
	return Array.isArray(details) ? (details[0] ?? null) : details;
}

export function mapPlaceOf(row: PlaceRow): MapPlace {
	const details = detailsOf(row);
	const placeType = details?.place_type;
	const countryCode = details?.country_code;
	return {
		id: row.id,
		name: row.name,
		placeType: isPlaceType(placeType) ? placeType : null,
		countryCode: isCountryCode(countryCode) ? countryCode : null,
		point:
			details?.latitude != null && details.longitude != null
				? { latitude: details.latitude, longitude: details.longitude }
				: null,
		cityId: details?.city_id ?? null
	};
}

export async function loadMapPlaces(): Promise<{ places: MapPlace[]; error?: string }> {
	const { rows, error } = await fetchAll<PlaceRow>((from, to) =>
		supabase
			.from('category_values')
			.select(
				'id, name, location_details!location_details_value_id_owner_id_category_code_fkey(place_type, country_code, latitude, longitude, city_id)'
			)
			.eq('category_code', 'location')
			.order('name')
			.order('id')
			.range(from, to)
	);
	if (error) return { places: [], error: loadErrorMessage(error) };
	return { places: rows.map(mapPlaceOf) };
}

export async function setPlacePoint(
	placeId: string,
	point: PlacePoint | null,
	wikidataId: string | null = null
): Promise<{ error?: string }> {
	const { error } = await supabase.rpc('set_place_point', {
		place: placeId,
		latitude: point?.latitude ?? null,
		longitude: point?.longitude ?? null,
		...(wikidataId ? { wikidata_id: wikidataId } : {})
	} as never);
	return error ? { error: await failureMessage(error, () => m.map.saveFailed) } : {};
}
