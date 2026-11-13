import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadMuseumPlaces } from '#lib/map/museum-places-data/museum-places-data.ts';
import { matchMuseums } from '#lib/map/museum-places/museum-places.ts';
import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';

const SUGGESTIONS = 3;

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
		const known = matchMuseums(name, museums, SUGGESTIONS);
		if (this.#name !== name) return;
		try {
			const found =
				known.length < SUGGESTIONS
					? await searchWikidataPlaces(name).catch((error: unknown) => {
							if (known.length === 0) throw error;
							return [];
						})
					: [];
			if (this.#name !== name) return;
			const fresh = found.filter(
				(place) => !known.some((museum) => museum.wikidataId === place.wikidataId)
			);
			const places = [...known, ...fresh].slice(0, SUGGESTIONS);
			this.places = places;
			this.status = places.length > 0 ? 'ready' : 'none';
		} catch {
			if (this.#name !== name) return;
			this.status = 'failed';
		}
	}
}
