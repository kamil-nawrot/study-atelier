import { fetchJson } from './wikimedia.ts';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const SEARCH_LIMIT = 30;
const LABEL_LANGUAGES = ['pl', 'en'];
const EXCLUDED_CLASSES = ['Q5', 'Q16521', 'Q4167410'];

export type SourceDate = {
	year: number;
	precision: number;
};

export type WikidataArtwork = {
	wikidataId: string;
	title: string;
	creators: string[];
	creatorNames: string[];
	hasCreator: boolean;
	date: SourceDate | null;
	file: string;
};

type Binding = Partial<
	Record<
		'item' | 'title' | 'file' | 'date' | 'creators' | 'creatorNames' | 'creatorCount',
		{ value: string }
	>
>;

type SparqlResponse = { results?: { bindings?: Binding[] } };

function sparqlString(text: string): string {
	return JSON.stringify(text.replace(/\s+/g, ' ').trim());
}

export function artworkSearchQuery(title: string): string {
	const languages = LABEL_LANGUAGES.map((language) => `"${language}"`).join(', ');
	const excluded = EXCLUDED_CLASSES.map((id) => `wd:${id}`).join(' ');
	const search = sparqlString(title);
	return `SELECT ?item ?title (MIN(?searchRank) AS ?order) (SAMPLE(?image) AS ?file) (SAMPLE(CONCAT(STR(?inception), "/", STR(?precision))) AS ?date)
(GROUP_CONCAT(DISTINCT ?creatorLabel; separator="|") AS ?creators)
(GROUP_CONCAT(DISTINCT ?creatorName; separator="|") AS ?creatorNames)
(COUNT(DISTINCT ?creatorStatement) AS ?creatorCount) WHERE {
  {
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
        mwapi:search ${search}; mwapi:language "${LABEL_LANGUAGES[0]}"; mwapi:limit "${SEARCH_LIMIT}".
      ?item wikibase:apiOutputItem mwapi:item.
      ?ordinal wikibase:apiOrdinal true.
    }
    BIND(?ordinal AS ?searchRank)
  } UNION {
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "Search";
        mwapi:srsearch ${search}; mwapi:srlimit "${SEARCH_LIMIT}"; wikibase:limit "${SEARCH_LIMIT}".
      ?item wikibase:apiOutputItem mwapi:title.
      ?ordinal wikibase:apiOrdinal true.
    }
    BIND(?ordinal + ${SEARCH_LIMIT} AS ?searchRank)
  }
  ?item wdt:P18 ?image.
  FILTER NOT EXISTS { VALUES ?excluded { ${excluded} } ?item wdt:P31 ?excluded }
  OPTIONAL {
    ?item p:P571 ?dateStatement.
    ?dateStatement wikibase:rank ?rank; psv:P571 ?dateValue.
    ?dateValue wikibase:timeValue ?inception; wikibase:timePrecision ?precision.
    FILTER(?rank != wikibase:DeprecatedRank)
  }
  OPTIONAL { ?item p:P170|p:P84 ?creatorStatement }
  OPTIONAL {
    ?item wdt:P170|wdt:P84 ?creator.
    FILTER(STRSTARTS(STR(?creator), STR(wd:)))
    OPTIONAL {
      ?creator rdfs:label|skos:altLabel ?creatorName.
      FILTER(LANG(?creatorName) IN (${languages}))
    }
  }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "${LABEL_LANGUAGES.join(',')},mul".
    ?item rdfs:label ?title.
    ?creator rdfs:label ?creatorLabel.
  }
}
GROUP BY ?item ?title
ORDER BY ?order`;
}

export function sourceDate(value: string | undefined): SourceDate | null {
	const match = value?.match(/^(-?)(\d+)-.*\/(\d+)$/);
	if (!match) return null;
	const year = Number(match[2]);
	const precision = Number(match[3]);
	if (match[1] === '-' || year === 0) return { year: -(year + 1), precision };
	return { year, precision };
}

function fileFromUrl(url: string | undefined): string | null {
	if (!url) return null;
	const name = url.split('/Special:FilePath/')[1];
	return name ? decodeURIComponent(name) : null;
}

function names(value: { value: string } | undefined): string[] {
	return [...new Set((value?.value ?? '').split('|').filter((name) => name !== ''))];
}

function toArtwork(binding: Binding): WikidataArtwork | null {
	const wikidataId = binding.item?.value.match(/(Q\d+)$/)?.[1];
	const file = fileFromUrl(binding.file?.value);
	if (!wikidataId || !file) return null;
	return {
		wikidataId,
		title: binding.title?.value ?? wikidataId,
		creators: names(binding.creators),
		creatorNames: names(binding.creatorNames),
		hasCreator: Number(binding.creatorCount?.value ?? 0) > 0,
		date: sourceDate(binding.date?.value),
		file
	};
}

export async function searchWikidataArtworks(title: string): Promise<WikidataArtwork[]> {
	const params = new URLSearchParams({ query: artworkSearchQuery(title), format: 'json' });
	const response = await fetchJson<SparqlResponse>(`${SPARQL_ENDPOINT}?${params}`, {
		Accept: 'application/sparql-results+json'
	});
	return (response.results?.bindings ?? []).flatMap((binding) => toArtwork(binding) ?? []);
}
