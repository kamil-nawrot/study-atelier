import { yearOutsideEra } from '#lib/catalogue/eras/eras.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export const MISSING_DATA: readonly MissingData[] = [
	'image',
	'year',
	'era',
	'period',
	'type',
	'outsideEra'
];

export function missingOf(artwork: WallArtwork): MissingData[] {
	return MISSING_DATA.filter((kind) => {
		if (kind === 'image') return !artwork.hasImage;
		if (kind === 'year') return artwork.yearTo === null;
		if (kind === 'era') return artwork.eraCode === null;
		if (kind === 'period') return artwork.period === null;
		if (kind === 'outsideEra') return yearOutsideEra(artwork);
		return artwork.typeCode === null;
	});
}
