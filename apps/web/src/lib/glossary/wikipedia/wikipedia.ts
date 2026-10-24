import { fetchJson } from '#lib/images/wikimedia/wikimedia.ts';
import {
	DEFINITION_MAX_LENGTH,
	firstSentence,
	isShortSentence,
	shortenDefinition
} from '#lib/glossary/glossary/glossary.ts';
import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { WikipediaArticle } from '#lib/glossary/types/wikipedia-article.ts';

const WIKIPEDIA_API = 'https://pl.wikipedia.org/w/api.php';
export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const SEARCH_LIMIT = 8;
const ARTICLE_LIMIT = 5;
const HUMAN = 'Q5';
const LEAD_DASHES = new Set(['–', '—', '−', '-']);

export const WIKIPEDIA_LICENCE = 'CC BY-SA 4.0';
export const WIKIPEDIA_LICENCE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/deed.pl';

const CATEGORY_HINTS: Partial<Record<GlossaryCategory, string>> = {
	architecture: 'architektura',
	painting: 'malarstwo',
	sculpture: 'rzeźba'
};

type SearchResponse = {
	query?: { search?: { pageid: number; title: string }[] };
};

export type Page = {
	pageid: number;
	title: string;
	extract?: string;
	fullurl?: string;
	pageprops?: { wikibase_item?: string; disambiguation?: string };
};

type PagesResponse = { query?: { pages?: Page[] } };

type Statement = { mainsnak?: { datavalue?: { value?: { id?: string } } } };

type EntitiesResponse = {
	entities?: Record<string, { claims?: { P31?: Statement[] } }>;
};

function wikipediaUrl(parameters: Record<string, string>): string {
	const query = new URLSearchParams({
		format: 'json',
		formatversion: '2',
		origin: '*',
		...parameters
	});
	return `${WIKIPEDIA_API}?${query}`;
}

export function searchQuery(name: string, category: GlossaryCategory, withHint: boolean): string {
	const hint = CATEGORY_HINTS[category];
	return withHint && hint ? `${name.trim()} ${hint}` : name.trim();
}

function capitalized(text: string): string {
	return `${text.charAt(0).toLocaleUpperCase('pl')}${text.slice(1)}`;
}

export function withoutLeadTerm(paragraph: string): string {
	let depth = 0;
	let outside = '';
	for (let index = 1; index < paragraph.length - 1; index += 1) {
		const char = paragraph[index];
		if (char === '(' || char === '[') depth += 1;
		else if ((char === ')' || char === ']') && depth > 0) depth -= 1;
		else if (depth === 0) {
			const dash =
				LEAD_DASHES.has(char) && paragraph[index - 1] === ' ' && paragraph[index + 1] === ' ';
			if (dash) {
				const lead = `${paragraph[0]}${outside}`.trim();
				const rest = paragraph.slice(index + 2).trim();
				return firstSentence(lead) === lead && rest ? capitalized(rest) : paragraph;
			}
			outside += char;
		}
	}
	return paragraph;
}

export function firstParagraph(extract: string, max = DEFINITION_MAX_LENGTH): string {
	const [first = '', next] = extract
		.split('\n')
		.map((line) => line.replace(/\s+/g, ' ').trim())
		.filter((line) => line !== '');
	const lead = withoutLeadTerm(first);
	const text = next && isShortSentence(lead) ? `${lead} ${firstSentence(next)}` : lead;
	return shortenDefinition(text, max);
}

export async function findPages(query: string): Promise<Page[]> {
	const found = await fetchJson<SearchResponse>(
		wikipediaUrl({
			action: 'query',
			list: 'search',
			srsearch: query,
			srnamespace: '0',
			srlimit: String(SEARCH_LIMIT),
			srprop: ''
		})
	);
	const hits = found.query?.search ?? [];
	if (hits.length === 0) return [];

	const details = await fetchJson<PagesResponse>(
		wikipediaUrl({
			action: 'query',
			prop: 'extracts|info|pageprops',
			exintro: '1',
			explaintext: '1',
			exlimit: 'max',
			inprop: 'url',
			ppprop: 'wikibase_item|disambiguation',
			pageids: hits.map((hit) => hit.pageid).join('|')
		})
	);
	const pages = new Map((details.query?.pages ?? []).map((page) => [page.pageid, page]));
	return hits.flatMap((hit) => {
		const page = pages.get(hit.pageid);
		return page && page.pageprops?.disambiguation === undefined ? [page] : [];
	});
}

async function humansAmong(pages: Page[]): Promise<Page[]> {
	const ids = pages.flatMap((page) =>
		page.pageprops?.wikibase_item ? [page.pageprops.wikibase_item] : []
	);
	if (ids.length === 0) return [];
	const query = new URLSearchParams({
		action: 'wbgetentities',
		ids: ids.join('|'),
		props: 'claims',
		format: 'json',
		formatversion: '2',
		origin: '*'
	});
	const response = await fetchJson<EntitiesResponse>(`${WIKIDATA_API}?${query}`);
	return pages.filter((page) => {
		const id = page.pageprops?.wikibase_item;
		const classes = id ? response.entities?.[id]?.claims?.P31 : undefined;
		return classes?.some((statement) => statement.mainsnak?.datavalue?.value?.id === HUMAN);
	});
}

export function articleOf(page: Page, max = DEFINITION_MAX_LENGTH): WikipediaArticle[] {
	const extract = firstParagraph(page.extract ?? '', max);
	if (!extract) return [];
	const url =
		page.fullurl ??
		`https://pl.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`;
	return [{ title: page.title, url, extract }];
}

export async function searchArticles(
	name: string,
	category: GlossaryCategory
): Promise<WikipediaArticle[]> {
	const attempts =
		category === 'person'
			? [searchQuery(name, category, false)]
			: [searchQuery(name, category, true), searchQuery(name, category, false)];
	for (const query of [...new Set(attempts)]) {
		const pages = await findPages(query);
		const matching = category === 'person' ? await humansAmong(pages) : pages;
		const articles = matching.flatMap((page) => articleOf(page)).slice(0, ARTICLE_LIMIT);
		if (articles.length > 0) return articles;
	}
	return [];
}

export function sourceOf(article: WikipediaArticle, fetchedOn: Date = new Date()): WikipediaSource {
	const month = String(fetchedOn.getMonth() + 1).padStart(2, '0');
	const day = String(fetchedOn.getDate()).padStart(2, '0');
	return {
		title: article.title,
		url: article.url,
		licence: WIKIPEDIA_LICENCE,
		fetchedOn: `${fetchedOn.getFullYear()}-${month}-${day}`
	};
}
