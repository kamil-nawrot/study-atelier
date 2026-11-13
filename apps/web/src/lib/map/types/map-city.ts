import type { MapCityPlace } from './map-city-place.ts';
import type { PlacePoint } from './place-point.ts';

export type MapCity = {
	key: string;
	name: string;
	countryCode: string | null;
	point: PlacePoint;
	places: MapCityPlace[];
	count: number;
	seen: number;
};
