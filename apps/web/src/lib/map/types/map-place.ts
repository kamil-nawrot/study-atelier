import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { PlacePoint } from './place-point.ts';

export type MapPlace = {
	id: string;
	name: string;
	placeType: PlaceType | null;
	countryCode: string | null;
	point: PlacePoint | null;
};
