import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { MapPlace } from './map-place.ts';

export type MapCityPlace = {
	place: MapPlace;
	artworks: WallArtwork[];
};
