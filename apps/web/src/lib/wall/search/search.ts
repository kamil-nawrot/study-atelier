import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';

export function filterByTitleOrAuthor<T extends { title: string; authors: string[] }>(
	items: T[],
	query: string
): T[] {
	const term = normalizeForSearch(query);
	if (!term) return items;
	return items.filter((item) =>
		[item.title, ...item.authors].some((text) => normalizeForSearch(text).includes(term))
	);
}
