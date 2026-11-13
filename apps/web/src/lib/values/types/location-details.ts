import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

export type LocationDetails = {
	countryCode: string | null;
	placeType: PlaceType | null;
	point?: PlacePoint | null;
};
