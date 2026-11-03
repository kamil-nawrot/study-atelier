import { filterValuesOf, MISSING_DATA } from '#lib/wall/filter/filter.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type Blank = { kind: MissingData; count: number };

export function blanksOf(artworks: readonly WallArtwork[]): Blank[] {
	return MISSING_DATA.map((kind) => ({
		kind,
		count: artworks.filter((artwork) => filterValuesOf(artwork, 'missing').includes(kind)).length
	})).filter((blank) => blank.count > 0);
}
