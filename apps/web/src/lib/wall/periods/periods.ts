import { m } from '#lib/i18n/i18n.ts';
import {
	authorSortKeys,
	compareSortKeys,
	sortKeyOf
} from '#lib/catalogue/author-sort/author-sort.ts';
import { UNKNOWN_AUTHOR } from '#lib/wall/filter/filter.ts';
import type { PeriodGroup } from '#lib/wall/types/period-group.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export function byYear(a: WallArtwork, b: WallArtwork): number {
	if (a.yearTo === null && b.yearTo === null) return a.number - b.number;
	if (a.yearTo === null) return 1;
	if (b.yearTo === null) return -1;
	return a.yearTo - b.yearTo || a.number - b.number;
}

function collect<K>(
	artworks: WallArtwork[],
	keyOf: (artwork: WallArtwork) => K | null
): Map<K, WallArtwork[]> {
	const groups = new Map<K, WallArtwork[]>();
	for (const artwork of artworks) {
		const key = keyOf(artwork);
		if (key === null) continue;
		const members = groups.get(key);
		if (members) members.push(artwork);
		else groups.set(key, [artwork]);
	}
	return groups;
}

function group(
	key: string,
	code: EraCode | null,
	name: string,
	members: WallArtwork[]
): PeriodGroup {
	const starts = members.flatMap((artwork) => artwork.yearFrom ?? artwork.yearTo ?? []);
	const ends = members.flatMap((artwork) => artwork.yearTo ?? []);
	return {
		key,
		code,
		name,
		from: starts.length > 0 ? Math.min(...starts) : null,
		to: ends.length > 0 ? Math.max(...ends) : null,
		artworks: members.sort(byYear)
	};
}

export function groupByAuthor(artworks: WallArtwork[]): PeriodGroup[] {
	const groups = collect(artworks, (artwork) => artwork.authors[0] ?? UNKNOWN_AUTHOR);
	const keys = authorSortKeys(artworks);
	const byAuthorName = (a: string, b: string): number => {
		if (a === UNKNOWN_AUTHOR) return 1;
		if (b === UNKNOWN_AUTHOR) return -1;
		return compareSortKeys(sortKeyOf(a, keys), sortKeyOf(b, keys));
	};
	return [...groups.keys()]
		.sort(byAuthorName)
		.map((author) =>
			group(
				author,
				null,
				author === UNKNOWN_AUTHOR ? m.atelier.filters.unknownAuthor : author,
				groups.get(author) ?? []
			)
		);
}
