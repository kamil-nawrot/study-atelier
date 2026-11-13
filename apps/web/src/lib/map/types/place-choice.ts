import type { PlacePoint } from './place-point.ts';

export type PlaceChoice = {
	point: PlacePoint;
	wikidataId: string | null;
};
