import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { MapPlace } from './map-place.ts';
import type { PlacePoint } from './place-point.ts';

export type MapCityPlace = {
	place: MapPlace;
	artworks: WallArtwork[];
};

export type MapCity = {
	key: string;
	name: string;
	countryCode: string | null;
	point: PlacePoint;
	places: MapCityPlace[];
	count: number;
	seen: number;
};
