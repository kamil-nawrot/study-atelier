import { WIKIDATA_API, articleOf, findPages, type Page } from '#lib/glossary/wikipedia.ts';
import { fetchJson } from '#lib/images/wikimedia.ts';
import { EVENT_DESCRIPTION_MAX_LENGTH } from './event-form.ts';
import type { EventArticle, EventDates } from './types.ts';

const ARTICLE_LIMIT = 5;
const YEAR_PRECISION = 9;
const START = 'P580';
const END = 'P582';
const POINT = 'P585';

export type TimeStatement = {
	rank?: 'preferred' | 'normal' | 'deprecated';
	mainsnak?: { datavalue?: { value?: { time?: string; precision?: number } } };
};

export type Claims = Partial<Record<string, TimeStatement[]>>;

type EntitiesResponse = { entities?: Record<string, { claims?: Claims }> };

type Time = { year: number; exact: boolean };

function yearOf(time: string): number | null {
	const match = /^([+-])0*(\d+)-/.exec(time);
	if (!match) return null;
	const year = Number(match[2]) * (match[1] === '-' ? -1 : 1);
	return year === 0 || !Number.isSafeInteger(year) ? null : year;
}

function timesOf(statements: TimeStatement[] | undefined): Time[] {
	const usable = (statements ?? []).filter((statement) => statement.rank !== 'deprecated');
	const preferred = usable.filter((statement) => statement.rank === 'preferred');
	return (preferred.length > 0 ? preferred : usable).flatMap((statement) => {
		const value = statement.mainsnak?.datavalue?.value;
		const year = value?.time ? yearOf(value.time) : null;
		return year === null ? [] : [{ year, exact: (value?.precision ?? 0) >= YEAR_PRECISION }];
	});
}

function approximate(times: Time[]): boolean {
	return times.some((time) => !time.exact) || new Set(times.map((time) => time.year)).size > 1;
}

function earliest(times: Time[]): number {
	return Math.min(...times.map((time) => time.year));
}

function latest(times: Time[]): number {
	return Math.max(...times.map((time) => time.year));
}

export function datesOf(claims: Claims): EventDates | null {
	const starts = timesOf(claims[START]);
	const ends = timesOf(claims[END]);
	const points = timesOf(claims[POINT]);
	if (starts.length > 0 && ends.length > 0 && earliest(starts) <= latest(ends)) {
		const yearFrom = earliest(starts);
		const yearTo = latest(ends);
		return {
			yearFrom: yearFrom === yearTo ? null : yearFrom,
			yearTo,
			approximate: approximate(starts) || approximate(ends)
		};
	}
	const single = points.length > 0 ? points : starts.length > 0 ? starts : ends;
	if (single.length === 0) return null;
	return { yearFrom: null, yearTo: earliest(single), approximate: approximate(single) };
}

async function claimsOf(pages: Page[]): Promise<Record<string, Claims>> {
	const ids = pages.flatMap((page) =>
		page.pageprops?.wikibase_item ? [page.pageprops.wikibase_item] : []
	);
	if (ids.length === 0) return {};
	const query = new URLSearchParams({
		action: 'wbgetentities',
		ids: ids.join('|'),
		props: 'claims',
		format: 'json',
		formatversion: '2',
		origin: '*'
	});
	const response = await fetchJson<EntitiesResponse>(`${WIKIDATA_API}?${query}`);
	return Object.fromEntries(
		Object.entries(response.entities ?? {}).map(([id, entity]) => [id, entity.claims ?? {}])
	);
}

export async function searchEvents(name: string): Promise<EventArticle[]> {
	const query = name.trim();
	if (!query) return [];
	const pages = await findPages(query);
	const claims = await claimsOf(pages);
	return pages
		.flatMap((page) => {
			const id = page.pageprops?.wikibase_item;
			const dates = id && claims[id] ? datesOf(claims[id]) : null;
			if (!dates) return [];
			return articleOf(page, EVENT_DESCRIPTION_MAX_LENGTH).map((article) => ({
				...article,
				dates
			}));
		})
		.slice(0, ARTICLE_LIMIT);
}
