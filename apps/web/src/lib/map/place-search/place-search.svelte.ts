import {
	searchWikidataPlaces,
	PLACE_SUGGESTIONS
} from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadMuseumPlaces } from '#lib/map/museum-places-data/museum-places-data.ts';
import { matchMuseums } from '#lib/map/museum-places/museum-places.ts';
import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';

export type PlaceSearchStatus = 'searching' | 'ready' | 'none' | 'failed';

export class PlaceSearch {
	status = $state<PlaceSearchStatus>('searching');
	places = $state<WikidataPlace[]>([]);
	#name = '';

	async search(name: string): Promise<void> {
		this.#name = name;
		this.status = 'searching';
		this.places = [];
		const museums = await loadMuseumPlaces().catch(() => []);
		const known = matchMuseums(name, museums, PLACE_SUGGESTIONS);
		if (this.#name !== name) return;
		try {
			const found =
				known.length < PLACE_SUGGESTIONS
					? await searchWikidataPlaces(name).catch((error: unknown) => {
							if (known.length === 0) throw error;
							return [];
						})
					: [];
			if (this.#name !== name) return;
			const ids = new Set(known.map((place) => place.wikidataId));
			const places = [...known, ...found.filter((place) => !ids.has(place.wikidataId))].slice(
				0,
				PLACE_SUGGESTIONS
			);
			this.places = places;
			this.status = places.length > 0 ? 'ready' : 'none';
		} catch {
			if (this.#name !== name) return;
			this.status = 'failed';
		}
	}
}
