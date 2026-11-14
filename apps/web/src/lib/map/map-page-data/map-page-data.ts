import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadMapPlaces } from '#lib/map/places-data/places-data.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';

type MapPageData = {
	artworks: WallArtwork[];
	places: MapPlace[];
	error?: string;
};

export async function loadMap(): Promise<MapPageData> {
	const [atelier, places] = await Promise.all([loadAtelier(), loadMapPlaces()]);
	return {
		artworks: atelier.artworks,
		places: places.places,
		error: atelier.error ?? places.error
	};
}
