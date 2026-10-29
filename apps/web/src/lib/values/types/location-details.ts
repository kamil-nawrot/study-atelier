import type { PlaceType } from '#lib/catalogue/types/place-type.ts';

export type LocationDetails = {
	countryCode: string | null;
	placeType: PlaceType | null;
};
