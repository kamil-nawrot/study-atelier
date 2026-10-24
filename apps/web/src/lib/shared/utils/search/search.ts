const COMBINING_MARKS = /\p{M}/gu;

export function normalizeForSearch(text: string): string {
	return text
		.toLocaleLowerCase('pl')
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.replaceAll('ł', 'l')
		.trim();
}
