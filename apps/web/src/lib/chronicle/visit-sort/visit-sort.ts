import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';

const SORT_KEY = 'study-atelier:chronicle-sort';

export const VISIT_SORTS = ['newest', 'oldest'] as const;

export type VisitSort = (typeof VISIT_SORTS)[number];

export function rememberedVisitSort(): VisitSort {
	const stored = readStored('local', SORT_KEY);
	return VISIT_SORTS.find((sort) => sort === stored) ?? 'newest';
}

export function rememberVisitSort(sort: VisitSort): void {
	writeStored('local', SORT_KEY, sort);
}
