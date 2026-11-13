import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { MapFilter } from '#lib/map/types/map-filter.ts';
import { emptyFilter } from '#lib/wall/filter/filter.ts';
import { filterToParams } from '#lib/wall/filter-params/filter-params.ts';

export function cityWallHref(city: MapCity, filter: MapFilter): ResolvedPathname {
	const wall = emptyFilter();
	wall.locations = city.places.map(({ place }) => place.name);
	wall.wantToSee = filter === 'wantToSee';
	wall.seen = filter === 'seen';
	return `${resolve('/(app)/atelier')}?${filterToParams(wall).toString()}` as ResolvedPathname;
}
