import type { PlacePoint } from '#lib/map/types/place-point.ts';

export type PlaceCity = {
	id?: string;
	name: string;
	countryCode?: string | null;
	point?: PlacePoint | null;
	wikidataId?: string | null;
};
