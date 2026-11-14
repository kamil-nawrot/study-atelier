import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';
import type { MuseumPlace } from '#lib/map/types/museum-place.ts';

const MIN_PART = 3;

function keysOf(museum: MuseumPlace): string[] {
	return [museum.name, museum.alias ?? ''].filter(Boolean).map(valueKey);
}

function place(museum: MuseumPlace): WikidataPlace {
	return {
		wikidataId: museum.wikidataId,
		label: museum.name,
		description: isCountryCode(museum.countryCode) ? countryName(museum.countryCode) : '',
		latitude: museum.point.latitude,
		longitude: museum.point.longitude
	};
}

export function matchMuseums(
	name: string,
	museums: readonly MuseumPlace[],
	limit: number
): WikidataPlace[] {
	const wanted = [...new Set([name.split(',')[0], name].map(valueKey))].filter(Boolean);
	const exact = museums.filter((museum) => keysOf(museum).some((key) => wanted.includes(key)));
	const partial = museums.filter(
		(museum) =>
			!exact.includes(museum) &&
			keysOf(museum).some((key) =>
				wanted.some((part) => part.length >= MIN_PART && key.includes(part))
			)
	);
	return [...exact, ...partial].slice(0, limit).map(place);
}
