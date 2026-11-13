import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import { nearestTown } from '#lib/map/towns/towns.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { Town } from '#lib/map/types/town.ts';

export function townKey(place: TripPlace, towns: readonly Town[]): string | null {
	if (!place.point) return null;
	const town = nearestTown(place.point, towns);
	return town ? `${town.countryCode}:${town.name}` : null;
}

export function tripPlaceOf(places: readonly TripPlace[], name: string): TripPlace | undefined {
	const key = valueKey(name);
	return key === '' ? undefined : places.find((place) => valueKey(place.name) === key);
}

export function tripPlaceNames(
	city: string,
	places: readonly TripPlace[],
	towns: readonly Town[]
): Set<string> {
	const names = new Set<string>();
	const key = valueKey(city);
	if (key === '') return names;
	names.add(key);
	const place = tripPlaceOf(places, city);
	const town = place ? townKey(place, towns) : null;
	if (!town) return names;
	for (const site of places) {
		if (site.placeType === 'on_site' && townKey(site, towns) === town)
			names.add(valueKey(site.name));
	}
	return names;
}

export function tripArtworks(
	artworks: readonly WallArtwork[],
	city: string,
	places: readonly TripPlace[],
	towns: readonly Town[]
): WallArtwork[] {
	const names = tripPlaceNames(city, places, towns);
	if (names.size === 0) return [];
	return artworks.filter((artwork) => artwork.location && names.has(valueKey(artwork.location)));
}
