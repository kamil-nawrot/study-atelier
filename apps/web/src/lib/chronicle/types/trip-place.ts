import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

export type TripPlace = {
	name: string;
	placeType: PlaceType | null;
	point: PlacePoint | null;
};
