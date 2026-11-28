import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	classRootsQuery,
	fetchClassGroups,
	fetchCommonsCategory,
	personSearchQuery,
	searchFurtherWikidataArtworks,
	searchWikidataArtworks,
	searchWikidataPeople,
	sourceDate
} from './wikidata.ts';
import { WikimediaError } from '#lib/images/wikimedia/wikimedia.ts';

const fetchMock = vi.fn<typeof fetch>();

function sparqlResponse(bindings: Record<string, string>[]): Response {
	const wrapped = bindings.map((binding) =>
		Object.fromEntries(Object.entries(binding).map(([key, value]) => [key, { value }]))
	);
	return new Response(JSON.stringify({ results: { bindings: wrapped } }));
}

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
					creatorCount: '1',
					types: 'Q3305213',
					collectionCount: '1',
					superclassCount: '0'
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
				file: 'The Milkmaid.jpg',
				types: ['Q3305213'],
				inCollection: true,
				isClass: false
			}
		]);
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toMatch(/^https:\/\/query\.wikidata\.org\/sparql\?/);
		expect(init?.headers).toMatchObject({
			Accept: 'application/sparql-results+json',
			'Api-User-Agent': expect.stringContaining('github.com/kamil-nawrot/study-atelier')
		});
	});

	it('asks the further query when searching further', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(sparqlResponse([]));

		await searchFurtherWikidataArtworks('Brama Holsztyńska w Lubece');

		const query = new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('query');
		expect(query).toContain('wikibase:endpoint "pl.wikipedia.org"');
		expect(query).toContain('mwapi:srsearch "Brama~ Holsztyńska~ w Lubece~"');
	});

	it('fails with the status the service answered', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));

		await expect(searchWikidataArtworks('The Milkmaid')).rejects.toEqual(new WikimediaError(500));
	});
});

describe('personSearchQuery', () => {
	it('asks only for people with an image, with their dates of birth and death', () => {
		const query = personSearchQuery('Leonardo "da" Vinci');

		expect(query).toContain('mwapi:search "Leonardo \\"da\\" Vinci"');
		expect(query).toContain('?item wdt:P18 ?image.');
		expect(query).toContain('?item wdt:P31 wd:Q5.');
		expect(query).toContain('p:P569');
		expect(query).toContain('p:P570');
		expect(query).not.toContain('P279');
	});

	it('also asks for mythological, biblical and legendary characters when it looks for a figure', () => {
		const query = personSearchQuery('Herkules', true);

		expect(query).not.toContain('?item wdt:P31 wd:Q5.');
		expect(query).toContain('?item wdt:P31 ?class.');
		expect(query).toContain('wd:Q5 wd:Q95074 wd:Q4271324 wd:Q178885 wd:Q20643955 wd:Q15632617');
		expect(query).toContain('?class wdt:P279?/wdt:P279?/wdt:P279? ?root');
	});
});

describe('searchWikidataPeople', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('maps each person to a name, an image file and dates, and skips results without a file', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			sparqlResponse([
				{
					item: 'http://www.wikidata.org/entity/Q762',
					name: 'Leonardo da Vinci',
					file: 'http://commons.wikimedia.org/wiki/Special:FilePath/Leonardo%20self.jpg',
					born: '1452-04-15T00:00:00Z/11',
					died: '1519-05-02T00:00:00Z/11'
				},
				{ item: 'http://www.wikidata.org/entity/Q1', name: 'No file' }
			])
		);

		await expect(searchWikidataPeople('Leonardo')).resolves.toEqual([
			{
				wikidataId: 'Q762',
				name: 'Leonardo da Vinci',
				born: { year: 1452, precision: 11 },
				died: { year: 1519, precision: 11 },
				file: 'Leonardo self.jpg'
			}
		]);
	});
});

describe('classRootsQuery', () => {
	it('walks the superclasses of the given classes to the roots of artworks, buildings and excluded works', () => {
		const query = classRootsQuery(['Q3305213', 'Q11424']);

		expect(query).toContain('VALUES ?cls { wd:Q3305213 wd:Q11424 }');
		expect(query).toContain('wd:Q4502142');
		expect(query).toContain('wd:Q811979');
		expect(query).toContain('wd:Q2431196');
		expect(query).toContain('?cls wdt:P279* ?root.');
	});
});

describe('fetchClassGroups', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('groups each class as an artwork, a building or neither, and lets an excluded root win', async () => {
		vi.stubGlobal('fetch', fetchMock);
		const entity = (id: string): string => `http://www.wikidata.org/entity/${id}`;
		fetchMock.mockResolvedValue(
			sparqlResponse([
				{ cls: entity('Q1'), root: entity('Q4502142') },
				{ cls: entity('Q2'), root: entity('Q811979') },
				{ cls: entity('Q3'), root: entity('Q4502142') },
				{ cls: entity('Q3'), root: entity('Q2431196') }
			])
		);

		const groups = await fetchClassGroups(['Q1', 'Q2', 'Q3', 'Q4']);

		expect([...groups]).toEqual([
			['Q1', 'artwork'],
			['Q2', 'building'],
			['Q3', null],
			['Q4', null]
		]);
	});
});

describe('fetchCommonsCategory', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('reads the Commons category of an item', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({ claims: { P373: [{ mainsnak: { datavalue: { value: 'Mona Lisa' } } }] } })
			)
		);

		await expect(fetchCommonsCategory('Q12418')).resolves.toBe('Mona Lisa');
		const url = new URL(String(fetchMock.mock.calls[0][0]));
		expect(url.searchParams.get('action')).toBe('wbgetclaims');
		expect(url.searchParams.get('entity')).toBe('Q12418');
		expect(url.searchParams.get('property')).toBe('P373');
	});

	it('has no category when the item has none', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ claims: {} })));

		await expect(fetchCommonsCategory('Q1')).resolves.toBeNull();
	});
});
