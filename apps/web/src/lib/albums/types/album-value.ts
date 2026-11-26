import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { PlaceType } from '#lib/catalogue/types/place-type.ts';

export type AlbumValue = {
	id: string;
	revision: number;
	category: CategoryCode;
	wikidataId: string | null;
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	countryCode: string | null;
	placeType: PlaceType | null;
	name: string;
	alternativeNames: string[];
	summary: string | null;
	description: string | null;
	country: string | null;
};
