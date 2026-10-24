import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { OwnEntries } from '#lib/catalogue/types/own-entries.ts';

export type ArtworkInput = {
	title: string;
	authors: string[];
	authorUnknown: boolean;
	yearFrom: number | null;
	fromBeforeCommonEra: boolean;
	yearTo: number | null;
	toBeforeCommonEra: boolean;
	yearApproximate: boolean;
	typeCode: ArtworkTypeCode | null;
	eraCode: EraCode | null;
	period: string | null;
	styles: string[];
	materials: string[];
	location: string | null;
	notes: string;
	image: ArtworkImageInput | null;
	images: ArtworkImageInput[];
	own?: OwnEntries;
};
