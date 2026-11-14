import { fetchJson, SPARQL_TIMEOUT_SECONDS } from '#lib/images/wikimedia/wikimedia.ts';
import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const SEARCH_LIMIT = 10;
export const PLACE_SUGGESTIONS = 3;

type PlaceBinding = Partial<Record<'item' | 'label' | 'description' | 'coord', { value: string }>>;

type SparqlResponse = { results?: { bindings?: PlaceBinding[] } };

export function placeSearchQuery(name: string): string {
	const search = JSON.stringify(name.replace(/\s+/g, ' ').trim());
	return `SELECT ?item ?label ?description (SAMPLE(?point) AS ?coord) (MIN(?ordinal) AS ?order) WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
      mwapi:search ${search}; mwapi:language "pl"; mwapi:limit "${SEARCH_LIMIT}".
    ?item wikibase:apiOutputItem mwapi:item.
    ?ordinal wikibase:apiOrdinal true.
  }
  ?item wdt:P625 ?point.
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "pl,en,mul".
    ?item rdfs:label ?label.
    ?item schema:description ?description.
  }
}
GROUP BY ?item ?label ?description
ORDER BY ?order`;
}

export function pointOf(
	text: string | undefined
): Pick<WikidataPlace, 'latitude' | 'longitude'> | null {
	const match = text?.match(/^Point\((-?[\d.]+(?:e-?\d+)?) (-?[\d.]+(?:e-?\d+)?)\)$/i);
	if (!match) return null;
	const longitude = Number(match[1]);
	const latitude = Number(match[2]);
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
	return { latitude, longitude };
}

function toPlace(binding: PlaceBinding): WikidataPlace | null {
	const wikidataId = binding.item?.value.match(/(Q\d+)$/)?.[1];
	const point = pointOf(binding.coord?.value);
	if (!wikidataId || !point) return null;
	return {
		wikidataId,
		label: binding.label?.value ?? wikidataId,
		description: binding.description?.value ?? '',
		...point
	};
}

async function searchOnce(name: string): Promise<WikidataPlace[]> {
	const params = new URLSearchParams({ query: placeSearchQuery(name), format: 'json' });
	const response = await fetchJson<SparqlResponse>(
		`${SPARQL_ENDPOINT}?${params}`,
		{ Accept: 'application/sparql-results+json' },
		SPARQL_TIMEOUT_SECONDS
	);
	const places = (response.results?.bindings ?? []).flatMap((binding) => toPlace(binding) ?? []);
	return places.slice(0, PLACE_SUGGESTIONS);
}

export async function searchWikidataPlaces(name: string): Promise<WikidataPlace[]> {
	const whole = name.trim();
	const head = whole.split(',')[0].trim();
	if (head && head !== whole) {
		const places = await searchOnce(head);
		if (places.length > 0) return places;
	}
	return whole ? searchOnce(whole) : [];
}
