import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';

export function cityKey(place: TripPlace): string | null {
	return place.placeType === 'city' ? place.id : place.cityId;
}

export function tripPlaceOf(places: readonly TripPlace[], name: string): TripPlace | undefined {
	const key = valueKey(name);
	return key === '' ? undefined : places.find((place) => valueKey(place.name) === key);
}

export function tripPlaceNames(city: string, places: readonly TripPlace[]): Set<string> {
	const names = new Set<string>();
	const key = valueKey(city);
	if (key === '') return names;
	names.add(key);
	const place = tripPlaceOf(places, city);
	const id = place ? cityKey(place) : null;
	if (!id) return names;
	for (const site of places) {
		if (site.placeType === 'on_site' && site.cityId === id) names.add(valueKey(site.name));
	}
	return names;
}

export function tripArtworks(
	artworks: readonly WallArtwork[],
	city: string,
	places: readonly TripPlace[]
): WallArtwork[] {
	const names = tripPlaceNames(city, places);
	if (names.size === 0) return [];
	return artworks.filter((artwork) => artwork.location && names.has(valueKey(artwork.location)));
}
