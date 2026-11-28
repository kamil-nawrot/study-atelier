import { describe, expect, it } from 'vitest';
import { artworkSearchQuery, furtherArtworkSearchQuery, fuzzySearchText } from './artwork-query.ts';

describe('artworkSearchQuery', () => {
	it('searches labels for the title and keeps quotes in it safe', () => {
		const query = artworkSearchQuery('  The "Blue"\n Boy ');

		expect(query).toContain('mwapi:search "The \\"Blue\\" Boy"');
		expect(query).toContain('mwapi:language "pl"');
	});

	it('also searches the full text, so words in any order match, and lists prefix matches first', () => {
		const query = artworkSearchQuery('Bust of Nefertiti');

		expect(query).toContain('wikibase:api "Search"');
		expect(query).toContain('mwapi:srsearch "Bust of Nefertiti"');
		expect(query).toContain('BIND(?ordinal + 30 AS ?searchRank)');
		expect(query).toContain('ORDER BY ?order');
	});

	it('keeps the order of the query, so the searches run before the items with an image', () => {
		const query = artworkSearchQuery('Mona Lisa');

		expect(query).toContain('hint:Query hint:optimizer "None".');
		expect(query.indexOf('wikibase:api "EntitySearch"')).toBeLessThan(
			query.indexOf('?item wdt:P18 ?image.')
		);
	});

	it('asks only for items with an image, with their types, collections and superclasses', () => {
		const query = artworkSearchQuery('David');

		expect(query).toContain('?item wdt:P18 ?image.');
		expect(query).not.toContain('OPTIONAL { ?item wdt:P18');
		expect(query).toContain('OPTIONAL { ?item wdt:P31 ?type }');
		expect(query).toContain('OPTIONAL { ?item wdt:P195 ?collection }');
		expect(query).toContain('OPTIONAL { ?item wdt:P279 ?superclass }');
		expect(query).not.toContain('wdt:P279*');
	});
});

describe('fuzzySearchText', () => {
	it('lets the longer words differ in spelling and drops the search syntax', () => {
		expect(fuzzySearchText('Kuros z "Anavyssos"!')).toBe('Kuros~ z Anavyssos~');
	});
});

describe('furtherArtworkSearchQuery', () => {
	it('searches Polish Wikipedia for the title and reads the Wikidata item of its first three pages', () => {
		const query = furtherArtworkSearchQuery('Brama Lwic w "Mykenach"');

		expect(query).toContain('wikibase:endpoint "pl.wikipedia.org"');
		expect(query).toContain('mwapi:gsrsearch "Brama Lwic w \\"Mykenach\\""');
		expect(query).toContain('mwapi:gsrlimit "3"');
		expect(query).toContain('mwapi:ppprop "wikibase_item"');
		expect(query).toContain('BIND(xsd:integer(?index) + 0 AS ?searchRank)');
	});

	it('then searches Wikidata for spelling variants of the title', () => {
		const query = furtherArtworkSearchQuery('Auriga delficki');

		expect(query).toContain('mwapi:srsearch "Auriga~ delficki~"');
		expect(query).toContain('BIND(?ordinal + 30 AS ?searchRank)');
		expect(query).not.toContain('wikibase:api "EntitySearch"');
	});

	it('asks for the same details as the first search', () => {
		const query = furtherArtworkSearchQuery('David');

		expect(query).toContain('?item wdt:P18 ?image.');
		expect(query).toContain('OPTIONAL { ?item wdt:P195 ?collection }');
	});
});
