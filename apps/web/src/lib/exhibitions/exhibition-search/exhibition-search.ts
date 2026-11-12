import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

export const EXHIBITION_SEARCH_MIN_COUNT = 5;

export function matchingExhibitions(
	exhibitions: readonly ExhibitionSummary[],
	query: string
): readonly ExhibitionSummary[] {
	const term = normalizeForSearch(query);
	if (!term) return exhibitions;
	return exhibitions.filter((exhibition) => normalizeForSearch(exhibition.title).includes(term));
}
