import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { OwnEntries } from '#lib/catalogue/types/own-entries.ts';
import type { CategoryValues } from '#lib/card-index/types/category-values.ts';

export type ArtworkFormState = {
	title: string;
	values: CategoryValues;
	queries: Record<CategoryCode, string>;
	authorUnknown: boolean;
	spanMode: boolean;
	yearFrom: string;
	fromBeforeCommonEra: boolean;
	yearTo: string;
	toBeforeCommonEra: boolean;
	yearApproximate: boolean;
	typeCode: ArtworkTypeCode | '';
	eraCode: EraCode | null;
	notes: string;
	image: ArtworkImageInput | null;
	images: (ArtworkImageInput | null)[];
	own?: OwnEntries;
	ownQueries: Record<string, string>;
};
