import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type PeriodGroup = {
	key: string;
	code: EraCode | null;
	name: string;
	from: number | null;
	to: number | null;
	artworks: WallArtwork[];
};
