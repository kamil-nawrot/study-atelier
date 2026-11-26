import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { AlbumImage } from './album-image.ts';

export type AlbumArtwork = {
	id: string;
	revision: number;
	wikidataId: string | null;
	typeCode: ArtworkTypeCode | null;
	eraCode: EraCode | null;
	yearFrom: number | null;
	yearTo: number | null;
	yearApproximate: boolean;
	valueIds: string[];
	termIds: string[];
	eventIds: string[];
	images: AlbumImage[];
	title: string;
	alternativeTitles: string[];
	description: string | null;
};
