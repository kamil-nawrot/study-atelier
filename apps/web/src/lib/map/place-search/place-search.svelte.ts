import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
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
		try {
			const places = await searchWikidataPlaces(name);
			if (this.#name !== name) return;
			this.places = places;
			this.status = places.length > 0 ? 'ready' : 'none';
		} catch {
			if (this.#name !== name) return;
			this.status = 'failed';
		}
	}
}
