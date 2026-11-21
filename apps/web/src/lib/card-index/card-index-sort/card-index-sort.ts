import { compareSortKeys } from '#lib/catalogue/author-sort/author-sort.ts';
import { locale } from '#lib/i18n/i18n.ts';
import { readStoredJson, writeStored } from '#lib/shared/utils/storage/storage.ts';

const SORT_KEY = 'study-atelier:card-index-sort';

export const CARD_INDEX_SORTS = ['name', 'count', 'oldest', 'newest', 'country'] as const;

export type CardIndexSort = (typeof CARD_INDEX_SORTS)[number];

export type SortableRecord = {
	name: string;
	sortName?: string;
	count?: number;
	birthYear?: number;
	country?: string;
	year?: number;
	firstYear?: number;
};

const TAB_SORTS: Record<string, CardIndexSort[]> = {
	timeline: ['name', 'count', 'oldest', 'newest'],
	material: ['name', 'count'],
	author: ['name', 'count', 'oldest', 'newest'],
	location: ['name', 'count'],
	events: ['name', 'oldest', 'newest'],
	own: ['name', 'count']
};

export function sortsOf(tab: string): CardIndexSort[] {
	return TAB_SORTS[tab] ?? ['name'];
}

function storedSorts(): Record<string, unknown> {
	const stored = readStoredJson('local', SORT_KEY);
	return stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
}

export function rememberedSort(tab: string): CardIndexSort {
	const stored = storedSorts()[tab];
	return sortsOf(tab).find((sort) => sort === stored) ?? 'name';
}

export function rememberSort(tab: string, sort: CardIndexSort): void {
	writeStored('local', SORT_KEY, JSON.stringify({ ...storedSorts(), [tab]: sort }));
}

function byName(a: SortableRecord, b: SortableRecord): number {
	return compareSortKeys(a.sortName ?? a.name, b.sortName ?? b.name);
}

function missingLast<T>(
	a: T | undefined,
	b: T | undefined,
	compare: (a: T, b: T) => number
): number {
	if (a === undefined) return b === undefined ? 0 : 1;
	if (b === undefined) return -1;
	return compare(a, b);
}

function startOf(record: SortableRecord): number | undefined {
	return record.year ?? record.birthYear ?? record.firstYear;
}

const COLLATOR = new Intl.Collator(locale);

const COMPARE: Record<CardIndexSort, (a: SortableRecord, b: SortableRecord) => number> = {
	name: () => 0,
	count: (a, b) => (b.count ?? 0) - (a.count ?? 0),
	oldest: (a, b) => missingLast(startOf(a), startOf(b), (x, y) => x - y),
	newest: (a, b) => missingLast(startOf(a), startOf(b), (x, y) => y - x),
	country: (a, b) => missingLast(a.country, b.country, COLLATOR.compare)
};

export function sortRecords<T extends SortableRecord>(
	records: readonly T[],
	sort: CardIndexSort
): T[] {
	return [...records].sort((a, b) => COMPARE[sort](a, b) || byName(a, b));
}
