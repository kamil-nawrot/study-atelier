import { readStored, writeStored } from '#lib/shared/utils/storage/storage.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

const SORT_KEY = 'study-atelier:exhibition-sort';

export const EXHIBITION_SORTS = ['changed', 'name', 'count'] as const;

export type ExhibitionSort = (typeof EXHIBITION_SORTS)[number];

export function rememberedExhibitionSort(): ExhibitionSort {
	const stored = readStored('local', SORT_KEY);
	return EXHIBITION_SORTS.find((sort) => sort === stored) ?? 'changed';
}

export function rememberExhibitionSort(sort: ExhibitionSort): void {
	writeStored('local', SORT_KEY, sort);
}

export function sortExhibitions(
	exhibitions: readonly ExhibitionSummary[],
	sort: ExhibitionSort
): readonly ExhibitionSummary[] {
	if (sort === 'changed') return exhibitions;
	const byTitle = (a: ExhibitionSummary, b: ExhibitionSummary): number =>
		a.title.localeCompare(b.title, 'pl');
	if (sort === 'name') return [...exhibitions].sort(byTitle);
	return [...exhibitions].sort((a, b) => b.artworkCount - a.artworkCount || byTitle(a, b));
}
