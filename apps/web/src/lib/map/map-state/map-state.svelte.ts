import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { filterCounts, mapCities, placesToFill } from '#lib/map/map-cities/map-cities.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import type { Geography } from '#lib/map/types/geography.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { MapFilter } from '#lib/map/types/map-filter.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import type { PlaceChoice } from '#lib/map/types/place-choice.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

export class MapState {
	places = $state<MapPlace[]>([]);
	geography = $state<Geography>();
	geographyFailed = $state(false);
	filter = $state<MapFilter>('all');
	selectedKey = $state<string>();
	filling = $state(false);
	skipped = $state<string[]>([]);
	choice = $state<PlaceChoice | null>(null);
	focus = $state<PlacePoint | null>(null);
	saving = $state(false);
	saveError = $state<string>();
	#artworks: () => WallArtwork[] = () => [];

	constructor(places: MapPlace[], artworks: () => WallArtwork[]) {
		this.places = places;
		this.#artworks = artworks;
	}

	cities = $derived.by((): MapCity[] =>
		this.geography
			? mapCities(this.places, this.#artworks(), this.geography.towns, this.filter)
			: []
	);
	counts = $derived(filterCounts(this.places, this.#artworks()));
	missing = $derived(placesToFill(this.places, this.#artworks()));
	queue = $derived(this.missing.filter(({ place }) => !this.skipped.includes(place.id)));
	current = $derived(this.filling ? this.queue[0] : undefined);
	selected = $derived(this.cities.find((city) => city.key === this.selectedKey));
	fit = $derived.by((): PlacePoint[] => {
		if (this.focus) return [this.focus];
		return this.cities.map((city) => city.point);
	});

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

	startFilling(): void {
		this.filling = true;
		this.selectedKey = undefined;
		this.skipped = [];
		this.#next();
	}

	stopFilling(): void {
		this.filling = false;
		this.#next();
	}

	choose(choice: PlaceChoice): void {
		this.choice = choice;
		this.focus = choice.wikidataId ? choice.point : this.focus;
	}

	pick(point: PlacePoint): void {
		if (this.current) this.choice = { point, wikidataId: null };
	}

	skip(): void {
		if (this.current) this.skipped = [...this.skipped, this.current.place.id];
		this.#next();
	}

	async save(): Promise<void> {
		const place = this.current?.place;
		const choice = this.choice;
		if (!place || !choice || this.saving) return;
		this.saving = true;
		this.saveError = undefined;
		const { error } = await setPlacePoint(place.id, choice.point, choice.wikidataId);
		this.saving = false;
		if (error) {
			this.saveError = error;
			return;
		}
		this.places = this.places.map((other) =>
			other.id === place.id ? { ...other, point: choice.point } : other
		);
		this.#next();
	}

	#next(): void {
		this.choice = null;
		this.focus = null;
		this.saveError = undefined;
	}
}
