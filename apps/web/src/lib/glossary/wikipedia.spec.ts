import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchArticles, firstParagraph, searchQuery, sourceOf } from './wikipedia.ts';

type Fixture = {
	hits?: { pageid: number; title: string }[];
	pages?: Record<string, unknown>[];
	humans?: string[];
};

function respond(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

function stubWikipedia(fixtures: Record<string, Fixture>): ReturnType<typeof vi.fn> {
	const fetchMock = vi.fn(async (input: string | URL | Request) => {
		const url = new URL(String(input));
		if (url.hostname === 'www.wikidata.org') {
			const wanted = (url.searchParams.get('ids') ?? '').split('|');
			const humans = Object.values(fixtures).flatMap((fixture) => fixture.humans ?? []);
			return respond({
				entities: Object.fromEntries(
					wanted.map((id) => [
						id,
						{
							claims: {
								P31: [
									{
										mainsnak: {
											datavalue: { value: { id: humans.includes(id) ? 'Q5' : 'Q386724' } }
										}
									}
								]
							}
						}
					])
				)
			});
		}
		const search = url.searchParams.get('srsearch');
		if (search !== null) return respond({ query: { search: fixtures[search]?.hits ?? [] } });
		const ids = (url.searchParams.get('pageids') ?? '').split('|').map(Number);
		const pages = Object.values(fixtures).flatMap((fixture) => fixture.pages ?? []);
		return respond({ query: { pages: pages.filter((page) => ids.includes(Number(page.pageid))) } });
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

function page(
	pageid: number,
	title: string,
	extract: string,
	pageprops: Record<string, string> = {}
): Record<string, unknown> {
	return {
		pageid,
		title,
		extract,
		fullurl: `https://pl.wikipedia.org/wiki/${title.replaceAll(' ', '_')}`,
		pageprops
	};
}

describe('searchQuery', () => {
	it('adds the category word for architecture, painting and sculpture', () => {
		expect(searchQuery('nawa', 'architecture', true)).toBe('nawa architektura');
		expect(searchQuery('Dawid', 'sculpture', true)).toBe('Dawid rzeźba');
		expect(searchQuery('sfumato', 'painting', true)).toBe('sfumato malarstwo');
	});

	it('adds nothing for the other categories or without the hint', () => {
		expect(searchQuery(' sfumato ', 'technique', true)).toBe('sfumato');
		expect(searchQuery('idea', 'general', true)).toBe('idea');
		expect(searchQuery('Dawid', 'person', true)).toBe('Dawid');
		expect(searchQuery('nawa', 'architecture', false)).toBe('nawa');
	});
});

describe('firstParagraph', () => {
	it('takes the first paragraph of the introduction, collapsing white space', () => {
		expect(firstParagraph('\nNawa  to część\nkościoła.\nDruga linia.')).toBe('Nawa to część');
	});

	it('gives an empty text for an empty extract', () => {
		expect(firstParagraph('')).toBe('');
	});
});

describe('searchArticles', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('searches with the category word and gives the articles in the order of the search', async () => {
		const fetchMock = stubWikipedia({
			'nawa architektura': {
				hits: [
					{ pageid: 2, title: 'Transept' },
					{ pageid: 1, title: 'Nawa' }
				],
				pages: [
					page(1, 'Nawa', 'Nawa to część kościoła.\nDruga linia.'),
					page(2, 'Transept', 'Transept to nawa poprzeczna.')
				]
			}
		});

		const articles = await searchArticles('nawa', 'architecture');

		expect(articles).toEqual([
			{
				title: 'Transept',
				url: 'https://pl.wikipedia.org/wiki/Transept',
				extract: 'Transept to nawa poprzeczna.'
			},
			{
				title: 'Nawa',
				url: 'https://pl.wikipedia.org/wiki/Nawa',
				extract: 'Nawa to część kościoła.'
			}
		]);
		const first = new URL(String(fetchMock.mock.calls[0][0]));
		expect(first.hostname).toBe('pl.wikipedia.org');
		expect(first.searchParams.get('srsearch')).toBe('nawa architektura');
		expect(first.searchParams.get('origin')).toBe('*');
		expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Api-User-Agent')).toContain(
			'github.com/kamil-nawrot/study-atelier'
		);
	});

	it('searches again with the name alone when the hint finds nothing', async () => {
		const fetchMock = stubWikipedia({
			'sfumato malarstwo': { hits: [] },
			sfumato: {
				hits: [{ pageid: 3, title: 'Sfumato' }],
				pages: [page(3, 'Sfumato', 'Sfumato to technika malarska.')]
			}
		});

		const articles = await searchArticles('sfumato', 'painting');

		expect(articles.map((article) => article.title)).toEqual(['Sfumato']);
		const searches = fetchMock.mock.calls
			.map((call) => new URL(String(call[0])).searchParams.get('srsearch'))
			.filter((search) => search !== null);
		expect(searches).toEqual(['sfumato malarstwo', 'sfumato']);
	});

	it('searches once for a category without a hint and gives nothing when nothing is found', async () => {
		const fetchMock = stubWikipedia({ nic: { hits: [] } });

		expect(await searchArticles('nic', 'general')).toEqual([]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('leaves out disambiguation pages and pages without an introduction', async () => {
		stubWikipedia({
			'łuk architektura': {
				hits: [
					{ pageid: 4, title: 'Łuk (ujednoznacznienie)' },
					{ pageid: 5, title: 'Łuk (pusty)' },
					{ pageid: 6, title: 'Łuk (architektura)' }
				],
				pages: [
					page(4, 'Łuk (ujednoznacznienie)', 'Łuk może oznaczać:', { disambiguation: '' }),
					page(5, 'Łuk (pusty)', ''),
					page(6, 'Łuk (architektura)', 'Łuk to element konstrukcyjny.')
				]
			}
		});

		const articles = await searchArticles('łuk', 'architecture');

		expect(articles.map((article) => article.title)).toEqual(['Łuk (architektura)']);
	});

	it('keeps only articles about people for a person, by their Wikidata class', async () => {
		stubWikipedia({
			Dawid: {
				hits: [
					{ pageid: 7, title: 'Dawid (rzeźba)' },
					{ pageid: 8, title: 'Dawid (król)' }
				],
				pages: [
					page(7, 'Dawid (rzeźba)', 'Dawid to rzeźba Michała Anioła.', { wikibase_item: 'Q1' }),
					page(8, 'Dawid (król)', 'Dawid był królem Izraela.', { wikibase_item: 'Q2' })
				],
				humans: ['Q2']
			}
		});

		const articles = await searchArticles('Dawid', 'person');

		expect(articles.map((article) => article.title)).toEqual(['Dawid (król)']);
	});

	it('gives nothing for a person when no article is about a human', async () => {
		stubWikipedia({
			Dawid: {
				hits: [{ pageid: 7, title: 'Dawid (rzeźba)' }],
				pages: [page(7, 'Dawid (rzeźba)', 'Dawid to rzeźba.', { wikibase_item: 'Q1' })]
			}
		});

		expect(await searchArticles('Dawid', 'person')).toEqual([]);
	});

	it('gives at most five articles', async () => {
		const hits = Array.from({ length: 8 }, (_, position) => ({
			pageid: position + 10,
			title: `Artykuł ${position}`
		}));
		stubWikipedia({
			idea: {
				hits,
				pages: hits.map((hit) => page(hit.pageid, hit.title, `Treść ${hit.title}.`))
			}
		});

		expect(await searchArticles('idea', 'general')).toHaveLength(5);
	});

	it('fails when Wikipedia answers with an error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => respond({}, 500))
		);

		await expect(searchArticles('nawa', 'architecture')).rejects.toThrow();
	});

	it('fails when the request does not go through', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')))
		);
		vi.useFakeTimers();

		const failure = expect(searchArticles('nawa', 'architecture')).rejects.toThrow();
		await vi.advanceTimersByTimeAsync(2000);
		await failure;
		vi.useRealTimers();
	});
});

describe('sourceOf', () => {
	it('keeps the title, the address, the licence and the day the article was fetched', () => {
		const source = sourceOf(
			{ title: 'Nawa', url: 'https://pl.wikipedia.org/wiki/Nawa', extract: 'x' },
			new Date(2026, 9, 7)
		);

		expect(source).toEqual({
			title: 'Nawa',
			url: 'https://pl.wikipedia.org/wiki/Nawa',
			licence: 'CC BY-SA 4.0',
			fetchedOn: '2026-10-07'
		});
	});
});
