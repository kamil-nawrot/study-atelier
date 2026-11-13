import Binoculars from '@lucide/svelte/icons/binoculars';
import Globe from '@lucide/svelte/icons/globe';
import ScanEye from '@lucide/svelte/icons/scan-eye';
import type { LucideIcon } from '@lucide/svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { nearestTown } from '#lib/map/towns/towns.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { MapCityPlace } from '#lib/map/types/map-city-place.ts';
import type { MapFilter } from '#lib/map/types/map-filter.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import type { PlaceToFill } from '#lib/map/types/place-to-fill.ts';
import type { Town } from '#lib/map/types/town.ts';

export const MAP_FILTERS: readonly MapFilter[] = ['all', 'wantToSee', 'seen'];

export const MAP_FILTER_ICONS: Record<MapFilter, LucideIcon> = {
	all: Globe,
	wantToSee: Binoculars,
	seen: ScanEye
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

function cityOf(
	place: MapPlace & { point: NonNullable<MapPlace['point']> },
	towns: readonly Town[]
): MapCity {
	const town = nearestTown(place.point, towns);
	return {
		key: town ? `${town.countryCode}:${town.name}` : `place:${place.id}`,
		name: town?.name ?? ownName(place),
		countryCode: town?.countryCode ?? place.countryCode,
		point: town ? { latitude: town.latitude, longitude: town.longitude } : place.point,
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
	towns: readonly Town[],
	filter: MapFilter
): MapCity[] {
	const byPlace = artworksByPlace(artworks.filter((artwork) => matchesMapFilter(artwork, filter)));
	const cities = new Map<string, MapCity>();
	for (const place of places) {
		const shown = byPlace.get(place.name);
		if (!place.point || !shown) continue;
		const city = cityOf({ ...place, point: place.point }, towns);
		const kept = cities.get(city.key) ?? city;
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

export function filterCounts(
	places: readonly MapPlace[],
	artworks: readonly WallArtwork[]
): Record<MapFilter, number> {
	const placed = new Set(places.filter((place) => place.point).map((place) => place.name));
	const shown = artworks.filter((artwork) => artwork.location && placed.has(artwork.location));
	return {
		all: shown.length,
		wantToSee: shown.filter((artwork) => matchesMapFilter(artwork, 'wantToSee')).length,
		seen: shown.filter((artwork) => matchesMapFilter(artwork, 'seen')).length
	};
}

export function placesToFill(
	places: readonly MapPlace[],
	artworks: readonly WallArtwork[]
): PlaceToFill[] {
	const byPlace = artworksByPlace(artworks);
	return places
		.filter((place) => !place.point && byPlace.has(place.name))
		.map((place) => ({ place, count: byPlace.get(place.name)?.length ?? 0 }))
		.sort(
			(first, second) =>
				byCount(first, second) || first.place.name.localeCompare(second.place.name, 'pl')
		);
}
