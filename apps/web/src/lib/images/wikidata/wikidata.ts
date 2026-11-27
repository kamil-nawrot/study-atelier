import { fetchJson, SPARQL_TIMEOUT_SECONDS } from '#lib/images/wikimedia/wikimedia.ts';
import {
	ARTWORK_ROOTS,
	BUILDING_ROOTS,
	EXCLUDED_ROOTS
} from '#lib/images/art-classes/art-classes.ts';
import type { ClassGroup } from '#lib/images/types/class-group.ts';
import type { SourceDate } from '#lib/images/types/source-date.ts';
import type { WikidataArtwork } from '#lib/images/types/wikidata-artwork.ts';
import type { WikidataPerson } from '#lib/images/types/wikidata-person.ts';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_CATEGORY = 'P373';
const SEARCH_LIMIT = 30;
const LABEL_LANGUAGES = ['pl', 'en'];
const HUMAN = 'Q5';
const FIGURE_ROOTS = [HUMAN, 'Q95074', 'Q4271324', 'Q178885', 'Q20643955', 'Q15632617'];

type Binding = Partial<
	Record<
		| 'item'
		| 'title'
		| 'file'
		| 'date'
		| 'creators'
		| 'creatorNames'
		| 'creatorCount'
		| 'types'
		| 'collectionCount'
		| 'superclassCount',
		{ value: string }
	>
>;

type PersonBinding = Partial<Record<'item' | 'name' | 'file' | 'born' | 'died', { value: string }>>;

type ClassBinding = Partial<Record<'cls' | 'root', { value: string }>>;

type SparqlResponse<T = Binding> = { results?: { bindings?: T[] } };

function sparqlString(text: string): string {
	return JSON.stringify(text.replace(/\s+/g, ' ').trim());
}

export function artworkSearchQuery(title: string): string {
	const languages = LABEL_LANGUAGES.map((language) => `"${language}"`).join(', ');
	const search = sparqlString(title);
	return `SELECT ?item ?title (MIN(?searchRank) AS ?order) (SAMPLE(?image) AS ?file) (SAMPLE(CONCAT(STR(?inception), "/", STR(?precision))) AS ?date)
(GROUP_CONCAT(DISTINCT ?creatorLabel; separator="|") AS ?creators)
(GROUP_CONCAT(DISTINCT ?creatorName; separator="|") AS ?creatorNames)
(COUNT(DISTINCT ?creatorStatement) AS ?creatorCount)
(GROUP_CONCAT(DISTINCT STRAFTER(STR(?type), STR(wd:)); separator="|") AS ?types)
(COUNT(DISTINCT ?collection) AS ?collectionCount)
(COUNT(DISTINCT ?superclass) AS ?superclassCount) WHERE {
  hint:Query hint:optimizer "None".
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
  OPTIONAL { ?item wdt:P31 ?type }
  OPTIONAL { ?item wdt:P195 ?collection }
  OPTIONAL { ?item wdt:P279 ?superclass }
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

function lifeDate(property: string, name: string): string {
	return `OPTIONAL {
    ?item p:${property} ?${name}Statement.
    ?${name}Statement wikibase:rank ?${name}Rank; psv:${property} ?${name}Value.
    ?${name}Value wikibase:timeValue ?${name}Time; wikibase:timePrecision ?${name}Precision.
    FILTER(?${name}Rank != wikibase:DeprecatedRank)
  }`;
}

function personClassFilter(figure: boolean): string {
	if (!figure) return `?item wdt:P31 wd:${HUMAN}.`;
	const roots = FIGURE_ROOTS.map((id) => `wd:${id}`).join(' ');
	return `?item wdt:P31 ?class.
  FILTER EXISTS { VALUES ?root { ${roots} } ?class wdt:P279?/wdt:P279?/wdt:P279? ?root }`;
}

export function personSearchQuery(name: string, figure = false): string {
	return `SELECT ?item ?name (MIN(?ordinal) AS ?order) (SAMPLE(?image) AS ?file)
(SAMPLE(CONCAT(STR(?bornTime), "/", STR(?bornPrecision))) AS ?born)
(SAMPLE(CONCAT(STR(?diedTime), "/", STR(?diedPrecision))) AS ?died) WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
      mwapi:search ${sparqlString(name)}; mwapi:language "${LABEL_LANGUAGES[0]}"; mwapi:limit "${SEARCH_LIMIT}".
    ?item wikibase:apiOutputItem mwapi:item.
    ?ordinal wikibase:apiOrdinal true.
  }
  ?item wdt:P18 ?image.
  ${personClassFilter(figure)}
  ${lifeDate('P569', 'born')}
  ${lifeDate('P570', 'died')}
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "${LABEL_LANGUAGES.join(',')},mul".
    ?item rdfs:label ?name.
  }
}
GROUP BY ?item ?name
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
		file,
		types: names(binding.types),
		inCollection: Number(binding.collectionCount?.value ?? 0) > 0,
		isClass: Number(binding.superclassCount?.value ?? 0) > 0
	};
}

export async function searchWikidataArtworks(title: string): Promise<WikidataArtwork[]> {
	const params = new URLSearchParams({ query: artworkSearchQuery(title), format: 'json' });
	const response = await fetchJson<SparqlResponse>(
		`${SPARQL_ENDPOINT}?${params}`,
		{ Accept: 'application/sparql-results+json' },
		SPARQL_TIMEOUT_SECONDS
	);
	return (response.results?.bindings ?? []).flatMap((binding) => toArtwork(binding) ?? []);
}

function toPerson(binding: PersonBinding): WikidataPerson | null {
	const wikidataId = binding.item?.value.match(/(Q\d+)$/)?.[1];
	const file = fileFromUrl(binding.file?.value);
	if (!wikidataId || !file) return null;
	return {
		wikidataId,
		name: binding.name?.value ?? wikidataId,
		born: sourceDate(binding.born?.value),
		died: sourceDate(binding.died?.value),
		file
	};
}

export async function searchWikidataPeople(
	name: string,
	figure = false
): Promise<WikidataPerson[]> {
	const params = new URLSearchParams({ query: personSearchQuery(name, figure), format: 'json' });
	const response = await fetchJson<SparqlResponse<PersonBinding>>(
		`${SPARQL_ENDPOINT}?${params}`,
		{ Accept: 'application/sparql-results+json' },
		SPARQL_TIMEOUT_SECONDS
	);
	return (response.results?.bindings ?? []).flatMap((binding) => toPerson(binding) ?? []);
}

export function classRootsQuery(classIds: string[]): string {
	const classes = classIds.map((id) => `wd:${id}`).join(' ');
	const roots = [...ARTWORK_ROOTS, ...BUILDING_ROOTS, ...EXCLUDED_ROOTS]
		.map((id) => `wd:${id}`)
		.join(' ');
	return `SELECT ?cls ?root WHERE {
  VALUES ?cls { ${classes} }
  VALUES ?root { ${roots} }
  ?cls wdt:P279* ?root.
}`;
}

function groupOf(roots: Set<string>): ClassGroup | null {
	if (EXCLUDED_ROOTS.some((id) => roots.has(id))) return null;
	if (ARTWORK_ROOTS.some((id) => roots.has(id))) return 'artwork';
	if (BUILDING_ROOTS.some((id) => roots.has(id))) return 'building';
	return null;
}

export async function fetchClassGroups(
	classIds: string[]
): Promise<Map<string, ClassGroup | null>> {
	const params = new URLSearchParams({ query: classRootsQuery(classIds), format: 'json' });
	const response = await fetchJson<SparqlResponse<ClassBinding>>(
		`${SPARQL_ENDPOINT}?${params}`,
		{ Accept: 'application/sparql-results+json' },
		SPARQL_TIMEOUT_SECONDS
	);
	const roots = new Map(classIds.map((id) => [id, new Set<string>()]));
	for (const binding of response.results?.bindings ?? []) {
		const cls = binding.cls?.value.match(/(Q\d+)$/)?.[1];
		const root = binding.root?.value.match(/(Q\d+)$/)?.[1];
		if (cls && root) roots.get(cls)?.add(root);
	}
	return new Map([...roots].map(([id, found]) => [id, groupOf(found)]));
}

type ClaimsResponse = {
	claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]>;
};

export async function fetchCommonsCategory(wikidataId: string): Promise<string | null> {
	const params = new URLSearchParams({
		action: 'wbgetclaims',
		entity: wikidataId,
		property: COMMONS_CATEGORY,
		format: 'json',
		origin: '*'
	});
	const response = await fetchJson<ClaimsResponse>(`${WIKIDATA_API}?${params}`);
	const value = response.claims?.[COMMONS_CATEGORY]?.[0]?.mainsnak?.datavalue?.value;
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}
