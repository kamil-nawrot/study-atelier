export const SEARCH_LIMIT = 30;
const WIKIPEDIA_LIMIT = 3;
export const LABEL_LANGUAGES = ['pl', 'en'];
const MIN_FUZZY_WORD_LENGTH = 4;

export function sparqlString(text: string): string {
	return JSON.stringify(text.replace(/\s+/g, ' ').trim());
}

export function fuzzySearchText(title: string): string {
	return title
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim()
		.split(' ')
		.filter((word) => word !== '')
		.map((word) => (word.length >= MIN_FUZZY_WORD_LENGTH ? `${word}~` : word))
		.join(' ');
}

function entitySearch(text: string, offset: number): string {
	return `{
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
        mwapi:search ${sparqlString(text)}; mwapi:language "${LABEL_LANGUAGES[0]}"; mwapi:limit "${SEARCH_LIMIT}".
      ?item wikibase:apiOutputItem mwapi:item.
      ?ordinal wikibase:apiOrdinal true.
    }
    BIND(?ordinal + ${offset} AS ?searchRank)
  }`;
}

function textSearch(text: string, offset: number): string {
	return `{
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "Search";
        mwapi:srsearch ${sparqlString(text)}; mwapi:srlimit "${SEARCH_LIMIT}"; wikibase:limit "${SEARCH_LIMIT}".
      ?item wikibase:apiOutputItem mwapi:title.
      ?ordinal wikibase:apiOrdinal true.
    }
    BIND(?ordinal + ${offset} AS ?searchRank)
  }`;
}

function wikipediaSearch(text: string, offset: number): string {
	return `{
    SERVICE wikibase:mwapi {
      bd:serviceParam wikibase:endpoint "pl.wikipedia.org"; wikibase:api "Generator"; wikibase:limit "${WIKIPEDIA_LIMIT}";
        mwapi:generator "search"; mwapi:gsrsearch ${sparqlString(text)}; mwapi:gsrnamespace "0"; mwapi:gsrlimit "${WIKIPEDIA_LIMIT}";
        mwapi:prop "pageprops"; mwapi:ppprop "wikibase_item".
      ?item wikibase:apiOutputItem mwapi:item.
      ?index wikibase:apiOutput "@index".
    }
    BIND(xsd:integer(?index) + ${offset} AS ?searchRank)
  }`;
}

function artworkQuery(searches: string[]): string {
	const languages = LABEL_LANGUAGES.map((language) => `"${language}"`).join(', ');
	return `SELECT ?item ?title (MIN(?searchRank) AS ?order) (SAMPLE(?image) AS ?file) (SAMPLE(CONCAT(STR(?inception), "/", STR(?precision))) AS ?date)
(GROUP_CONCAT(DISTINCT ?creatorLabel; separator="|") AS ?creators)
(GROUP_CONCAT(DISTINCT ?creatorName; separator="|") AS ?creatorNames)
(COUNT(DISTINCT ?creatorStatement) AS ?creatorCount)
(GROUP_CONCAT(DISTINCT STRAFTER(STR(?type), STR(wd:)); separator="|") AS ?types)
(COUNT(DISTINCT ?collection) AS ?collectionCount)
(COUNT(DISTINCT ?superclass) AS ?superclassCount) WHERE {
  hint:Query hint:optimizer "None".
  ${searches.join(' UNION ')}
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

export function artworkSearchQuery(title: string): string {
	return artworkQuery([entitySearch(title, 0), textSearch(title, SEARCH_LIMIT)]);
}

export function furtherArtworkSearchQuery(title: string): string {
	return artworkQuery([
		wikipediaSearch(title, 0),
		textSearch(fuzzySearchText(title), SEARCH_LIMIT)
	]);
}
