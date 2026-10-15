import type { WallArtwork } from './types.ts';

const collator = new Intl.Collator('pl');

export function compareSortKeys(a: string, b: string): number {
	return collator.compare(a, b);
}

export function authorSortKeys(artworks: WallArtwork[]): Map<string, string> {
	const keys = new Map<string, string>();
	for (const artwork of artworks) {
		artwork.authors.forEach((author, index) => {
			const sortName = artwork.authorSortNames?.[index];
			if (sortName) keys.set(author, sortName);
			else if (!keys.has(author)) keys.set(author, author);
		});
	}
	return keys;
}

export function sortKeyOf(author: string, keys: ReadonlyMap<string, string>): string {
	return keys.get(author) ?? author;
}
