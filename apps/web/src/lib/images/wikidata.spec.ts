import { afterEach, describe, expect, it, vi } from 'vitest';
import { artworkSearchQuery, searchWikidataArtworks, sourceDate } from './wikidata.ts';
import { WikimediaError } from './wikimedia.ts';

const fetchMock = vi.fn<typeof fetch>();

function sparqlResponse(bindings: Record<string, string>[]): Response {
	const wrapped = bindings.map((binding) =>
		Object.fromEntries(Object.entries(binding).map(([key, value]) => [key, { value }]))
	);
	return new Response(JSON.stringify({ results: { bindings: wrapped } }));
}

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

	it('asks only for items with an image, and no people', () => {
		const query = artworkSearchQuery('David');

		expect(query).toContain('?item wdt:P18 ?image.');
		expect(query).not.toContain('OPTIONAL { ?item wdt:P18');
		expect(query).toContain('wd:Q5');
	});
});

describe('sourceDate', () => {
	it('reads the year and its precision', () => {
		expect(sourceDate('1665-01-01T00:00:00Z/9')).toEqual({ year: 1665, precision: 9 });
	});

	it('turns the XSD year numbering before year one into years before the common era', () => {
		expect(sourceDate('-0140-01-01T00:00:00Z/7')).toEqual({ year: -141, precision: 7 });
		expect(sourceDate('0000-01-01T00:00:00Z/9')).toEqual({ year: -1, precision: 9 });
	});

	it('has no date without a value', () => {
		expect(sourceDate(undefined)).toBeNull();
		expect(sourceDate('unknown')).toBeNull();
	});
});

describe('searchWikidataArtworks', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('maps each result to an artwork with its file name and creators and drops a result without a file', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			sparqlResponse([
				{
					item: 'http://www.wikidata.org/entity/Q167605',
					title: 'The Milkmaid',
					file: 'http://commons.wikimedia.org/wiki/Special:FilePath/The%20Milkmaid.jpg',
					date: '1658-01-01T00:00:00Z/9',
					creators: 'Johannes Vermeer',
					creatorNames: 'Johannes Vermeer|Jan Vermeer',
					creatorCount: '1'
				},
				{ item: 'http://www.wikidata.org/entity/Q42', creators: '', creatorCount: '0' }
			])
		);

		const artworks = await searchWikidataArtworks('The Milkmaid');

		expect(artworks).toEqual([
			{
				wikidataId: 'Q167605',
				title: 'The Milkmaid',
				creators: ['Johannes Vermeer'],
				creatorNames: ['Johannes Vermeer', 'Jan Vermeer'],
				hasCreator: true,
				date: { year: 1658, precision: 9 },
				file: 'The Milkmaid.jpg'
			}
		]);
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toMatch(/^https:\/\/query\.wikidata\.org\/sparql\?/);
		expect(init?.headers).toMatchObject({
			Accept: 'application/sparql-results+json',
			'Api-User-Agent': expect.stringContaining('github.com/kamil-nawrot/study-atelier')
		});
	});

	it('fails with the status the service answered', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));

		await expect(searchWikidataArtworks('The Milkmaid')).rejects.toEqual(new WikimediaError(500));
	});
});
