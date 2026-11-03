import { countValues, type Counted } from '#lib/statistics/distribution/distribution.ts';
import { UNKNOWN_AUTHOR } from '#lib/wall/filter/filter.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { Dimension } from '#lib/statistics/dimensions/dimensions.ts';

const TOP = 10;
const SHOWN_FROM_VALUES = 3;
const SHOWN_FROM_ARTWORKS = 2;

export type Ranking = {
	top: Counted[];
	values: number;
	single: number;
};

export function rankingOf(artworks: readonly WallArtwork[], dimension: Dimension): Ranking | null {
	const counted = countValues(artworks, dimension).filter((row) => row.value !== UNKNOWN_AUTHOR);
	const repeated = counted.filter((row) => row.count >= SHOWN_FROM_ARTWORKS).length;
	if (repeated < SHOWN_FROM_VALUES) return null;
	return {
		top: counted.slice(0, TOP),
		values: counted.length,
		single: counted.filter((row) => row.count === 1).length
	};
}
