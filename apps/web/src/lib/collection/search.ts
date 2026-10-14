const COMBINING_MARKS = /\p{M}/gu;

export function normalizeForSearch(text: string): string {
	return text
		.toLocaleLowerCase('pl')
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.replaceAll('ł', 'l')
		.trim();
}

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
