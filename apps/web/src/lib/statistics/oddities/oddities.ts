import { authorSortKeys, sortKeyOf } from '#lib/catalogue/author-sort/author-sort.ts';
import { yearsBetween } from '#lib/catalogue/years/years.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

const DATED_FROM = 2;
const LONG_BUILT_FROM = 10;
const VERSATILE_FROM = 2;
const MATERIALS_FROM = 3;

export type ArtworkOddity = { artwork: WallArtwork; value: number; tied: number };
export type AuthorOddity = { author: string; value: number; tied: number };

export type Oddities = {
	oldest?: ArtworkOddity;
	newest?: ArtworkOddity;
	longestBuilt?: ArtworkOddity;
	versatile?: AuthorOddity & { types: ArtworkTypeCode[] };
	materials?: AuthorOddity;
};

function firstYear(artwork: WallArtwork): number {
	return artwork.yearFrom ?? (artwork.yearTo as number);
}

function best(
	artworks: readonly WallArtwork[],
	valueOf: (artwork: WallArtwork) => number,
	higher: boolean
): ArtworkOddity | undefined {
	if (artworks.length === 0) return undefined;
	const sign = higher ? -1 : 1;
	const sorted = [...artworks].sort(
		(a, b) => sign * (valueOf(a) - valueOf(b)) || a.number - b.number
	);
	const value = valueOf(sorted[0]);
	return {
		artwork: sorted[0],
		value,
		tied: sorted.filter((artwork) => valueOf(artwork) === value).length - 1
	};
}

type AuthorFacts = { artworks: number; types: Set<ArtworkTypeCode>; materials: Set<string> };

function authorFacts(artworks: readonly WallArtwork[]): Map<string, AuthorFacts> {
	const facts = new Map<string, AuthorFacts>();
	for (const artwork of artworks) {
		for (const author of artwork.authors) {
			const entry = facts.get(author) ?? { artworks: 0, types: new Set(), materials: new Set() };
			entry.artworks += 1;
			if (artwork.typeCode) entry.types.add(artwork.typeCode);
			for (const material of artwork.materials) entry.materials.add(material);
			facts.set(author, entry);
		}
	}
	return facts;
}

function bestAuthor(
	facts: Map<string, AuthorFacts>,
	valueOf: (entry: AuthorFacts) => number,
	from: number,
	keys: ReadonlyMap<string, string>
): AuthorOddity | undefined {
	const ranked = [...facts]
		.filter(([, entry]) => valueOf(entry) >= from)
		.sort(
			([a, left], [b, right]) =>
				valueOf(right) - valueOf(left) ||
				right.artworks - left.artworks ||
				sortKeyOf(a, keys).localeCompare(sortKeyOf(b, keys), 'pl')
		);
	if (ranked.length === 0) return undefined;
	const [author, entry] = ranked[0];
	const value = valueOf(entry);
	return { author, value, tied: ranked.filter(([, other]) => valueOf(other) === value).length - 1 };
}

export function odditiesOf(
	artworks: WallArtwork[],
	typeOrder: readonly ArtworkTypeCode[]
): Oddities {
	const dated = artworks.filter((artwork) => artwork.yearTo !== null);
	const ranged = dated.filter(
		(artwork) =>
			artwork.yearFrom !== null &&
			yearsBetween(artwork.yearFrom, artwork.yearTo as number) >= LONG_BUILT_FROM
	);
	const facts = authorFacts(artworks);
	const keys = authorSortKeys(artworks);
	const versatile = bestAuthor(facts, (entry) => entry.types.size, VERSATILE_FROM, keys);
	return {
		...(dated.length >= DATED_FROM
			? {
					oldest: best(dated, firstYear, false),
					newest: best(dated, (artwork) => artwork.yearTo as number, true)
				}
			: {}),
		longestBuilt: best(
			ranged,
			(artwork) => yearsBetween(artwork.yearFrom as number, artwork.yearTo as number),
			true
		),
		versatile: versatile && {
			...versatile,
			types: typeOrder.filter((type) => facts.get(versatile.author)?.types.has(type))
		},
		materials: bestAuthor(facts, (entry) => entry.materials.size, MATERIALS_FROM, keys)
	};
}
