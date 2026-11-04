import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export const TYPED_SUGGESTIONS = 6;
const MIN_LETTERS = 3;

export type TitleSuggestion = {
	key: string;
	ids: string[];
	title: string;
	authors: string[];
	match: { start: number; end: number };
};

function foldChar(char: string): string {
	if (!/[\p{L}\p{N}]/u.test(char)) return ' ';
	const plain = char.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pl');
	const letter = plain === 'ł' ? 'l' : plain;
	return letter.length === 1 ? letter : char.toLocaleLowerCase('pl');
}

export function foldTitle(text: string): string {
	return Array.from(text, foldChar).join('');
}

function foldQuery(text: string): string {
	return foldTitle(text).trim().replace(/\s+/g, ' ');
}

function matchStart(title: string, query: string): number {
	return ` ${foldTitle(title)}`.indexOf(` ${query}`);
}

function wholeWord(title: string, query: string): boolean {
	return foldTitle(title).split(/\s+/).includes(query);
}

export function titleSuggestions(
	typed: string,
	artworks: readonly WallArtwork[],
	limit = TYPED_SUGGESTIONS
): TitleSuggestion[] {
	const query = foldQuery(typed);
	if (query === '') return [];
	const short = query.length < MIN_LETTERS;
	const groups = new Map<string, TitleSuggestion>();
	for (const artwork of artworks) {
		const start = matchStart(artwork.title, query);
		if (start < 0 || (short && !wholeWord(artwork.title, query))) continue;
		const key = `${foldQuery(artwork.title)}|${artwork.authors.map(foldQuery).join('|')}`;
		const group = groups.get(key);
		if (group) {
			group.ids.push(artwork.id);
			continue;
		}
		groups.set(key, {
			key,
			ids: [artwork.id],
			title: artwork.title,
			authors: artwork.authors,
			match: { start, end: start + query.length }
		});
	}
	return [...groups.values()]
		.sort(
			(left, right) =>
				Number(right.match.start === 0) - Number(left.match.start === 0) ||
				left.title.localeCompare(right.title, 'pl')
		)
		.slice(0, limit);
}
