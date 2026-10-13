const COMBINING_MARKS = /\p{M}/gu;

export function normalizeForSearch(text: string): string {
	return text
		.toLocaleLowerCase('pl')
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.replaceAll('ł', 'l')
		.trim();
}

export function filterByTitle<T extends { title: string }>(items: T[], query: string): T[] {
	const term = normalizeForSearch(query);
	if (!term) return items;
	return items.filter((item) => normalizeForSearch(item.title).includes(term));
}
