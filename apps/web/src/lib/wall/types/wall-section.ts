import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type WallSection = {
	key: string;
	level: number;
	code: EraCode | null;
	name: string;
	artworks: WallArtwork[];
	sections: WallSection[];
};
