import type { PlacePoint } from './place-point.ts';

export type MuseumPlace = {
	wikidataId: string;
	name: string;
	alias: string | null;
	countryCode: string;
	point: PlacePoint;
};
