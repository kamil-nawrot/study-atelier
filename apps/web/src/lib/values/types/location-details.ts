import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';
import type { PlaceCity } from '#lib/values/types/place-city.ts';

export type LocationDetails = {
	countryCode: string | null;
	placeType: PlaceType | null;
	point?: PlacePoint | null;
	wikidataId?: string | null;
	city?: PlaceCity | null;
};
