import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadMuseumPlaces } from '#lib/map/museum-places-data/museum-places-data.ts';
import { matchMuseums } from '#lib/map/museum-places/museum-places.ts';
import { countryName, isCountryCode } from '#lib/catalogue/countries/countries.ts';
import { searchTowns } from '#lib/map/town-search/town-search.ts';
import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';
import type { Town } from '#lib/map/types/town.ts';

const SUGGESTIONS = 3;

function townPlaces(name: string, towns: readonly Town[]): WikidataPlace[] {
	return searchTowns(name, towns, SUGGESTIONS).flatMap((town) =>
		town.wikidataId
			? [
					{
						wikidataId: town.wikidataId,
						label: town.name,
						description: isCountryCode(town.countryCode) ? countryName(town.countryCode) : '',
						latitude: town.latitude,
						longitude: town.longitude,
						...(isCountryCode(town.countryCode) ? { countryCode: town.countryCode } : {})
					}
				]
			: []
	);
}

export type PlaceSearchStatus = 'searching' | 'ready' | 'none' | 'failed';

export class PlaceSearch {
	status = $state<PlaceSearchStatus>('searching');
	places = $state<WikidataPlace[]>([]);
	#name = '';

	async search(name: string, towns?: readonly Town[]): Promise<void> {
		this.#name = name;
		this.status = 'searching';
		this.places = [];
		const known = towns
			? townPlaces(name, towns)
			: matchMuseums(name, await loadMuseumPlaces().catch(() => []), SUGGESTIONS);
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
