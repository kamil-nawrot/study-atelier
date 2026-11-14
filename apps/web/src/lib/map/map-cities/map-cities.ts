import Binoculars from '@lucide/svelte/icons/binoculars';
import Globe from '@lucide/svelte/icons/globe';
import Footprints from '@lucide/svelte/icons/footprints';
import type { LucideIcon } from '@lucide/svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { MapCityPlace } from '#lib/map/types/map-city-place.ts';
import type { MapFilter } from '#lib/map/types/map-filter.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

export const MAP_FILTERS: readonly MapFilter[] = ['all', 'wantToSee', 'seen'];

export const MAP_FILTER_ICONS: Record<MapFilter, LucideIcon> = {
	all: Globe,
	wantToSee: Binoculars,
	seen: Footprints
};

export function matchesMapFilter(artwork: WallArtwork, filter: MapFilter): boolean {
	if (filter === 'wantToSee') return artwork.wantToSee === true;
	if (filter === 'seen') return artwork.seen === true;
	return true;
}

export function artworksByPlace(artworks: readonly WallArtwork[]): Map<string, WallArtwork[]> {
	const byPlace = new Map<string, WallArtwork[]>();
	for (const artwork of artworks) {
		if (!artwork.location) continue;
		const list = byPlace.get(artwork.location) ?? [];
		list.push(artwork);
		byPlace.set(artwork.location, list);
	}
	return byPlace;
}

function ownName(place: MapPlace): string {
	return place.name.split(',')[0].trim() || place.name;
}

type Located = { key: string; city: MapPlace | null; point: PlacePoint };

function locate(place: MapPlace, byId: Map<string, MapPlace>): Located | null {
	if (place.cityId) {
		const city = byId.get(place.cityId);
		return city?.point ? { key: `city:${city.id}`, city, point: city.point } : null;
	}
	if (!place.point) return null;
	if (place.placeType === 'city')
		return { key: `city:${place.id}`, city: place, point: place.point };
	return { key: `place:${place.id}`, city: null, point: place.point };
}

function emptyCity(place: MapPlace, located: Located): MapCity {
	return {
		key: located.key,
		cityId: located.city?.id ?? null,
		name: located.city?.name ?? ownName(place),
		countryCode: located.city?.countryCode ?? place.countryCode,
		point: located.point,
		places: [],
		count: 0,
		seen: 0
	};
}

function byCount<T extends { count: number }>(first: T, second: T): number {
	return second.count - first.count;
}

export function mapCities(
	places: readonly MapPlace[],
	artworks: readonly WallArtwork[],
	filter: MapFilter
): MapCity[] {
	const byPlace = artworksByPlace(artworks.filter((artwork) => matchesMapFilter(artwork, filter)));
	const byId = new Map(places.map((place) => [place.id, place]));
	const cities = new Map<string, MapCity>();
	for (const place of places) {
		const shown = byPlace.get(place.name);
		const located = shown ? locate(place, byId) : null;
		if (!shown || !located) continue;
		const kept = cities.get(located.key) ?? emptyCity(place, located);
		const entry: MapCityPlace = { place, artworks: shown };
		kept.places.push(entry);
		kept.count += shown.length;
		kept.seen += shown.filter((artwork) => artwork.seen).length;
		cities.set(kept.key, kept);
	}
	for (const city of cities.values()) {
		city.places.sort((first, second) => second.artworks.length - first.artworks.length);
	}
	return [...cities.values()].sort(byCount);
}

export function onMap(places: readonly MapPlace[]): Set<string> {
	const byId = new Map(places.map((place) => [place.id, place]));
	return new Set(places.filter((place) => locate(place, byId)).map((place) => place.name));
}

export function filterCounts(
	places: readonly MapPlace[],
	artworks: readonly WallArtwork[]
): Record<MapFilter, number> {
	const placed = onMap(places);
	const shown = artworks.filter((artwork) => artwork.location && placed.has(artwork.location));
	return {
		all: shown.length,
		wantToSee: shown.filter((artwork) => matchesMapFilter(artwork, 'wantToSee')).length,
		seen: shown.filter((artwork) => matchesMapFilter(artwork, 'seen')).length
	};
}
