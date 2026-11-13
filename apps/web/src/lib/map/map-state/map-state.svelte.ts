import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { filterCounts, mapCities, onMap } from '#lib/map/map-cities/map-cities.ts';
import type { Geography } from '#lib/map/types/geography.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { MapFilter } from '#lib/map/types/map-filter.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

export class MapState {
	places = $state<MapPlace[]>([]);
	geography = $state<Geography>();
	geographyFailed = $state(false);
	filter = $state<MapFilter>('all');
	selectedKey = $state<string>();

	#artworks: () => WallArtwork[] = () => [];

	constructor(places: MapPlace[], artworks: () => WallArtwork[]) {
		this.places = places;
		this.#artworks = artworks;
	}

	cities = $derived.by((): MapCity[] =>
		this.geography ? mapCities(this.places, this.#artworks(), this.filter) : []
	);

	#allCities = $derived.by((): MapCity[] =>
		this.geography ? mapCities(this.places, this.#artworks(), 'all') : []
	);

	counts = $derived(filterCounts(this.places, this.#artworks()));
	placed = $derived(onMap(this.places).size > 0);
	selected = $derived(this.cities.find((city) => city.key === this.selectedKey));
	fit = $derived.by((): PlacePoint[] => this.#allCities.map((city) => city.point));

	async load(): Promise<void> {
		this.geographyFailed = false;
		try {
			this.geography = await loadGeography();
		} catch {
			this.geographyFailed = true;
		}
	}

	setFilter(filter: MapFilter): void {
		this.filter = filter;
		if (!this.cities.some((city) => city.key === this.selectedKey)) this.selectedKey = undefined;
	}

	select(city: MapCity): void {
		this.selectedKey = this.selectedKey === city.key ? undefined : city.key;
	}
}
