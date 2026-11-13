import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { Town } from '#lib/map/types/town.ts';

export type SuggestionSource = {
	artworks: readonly WallArtwork[];
	tripPlaces: readonly TripPlace[];
	towns: readonly Town[];
};
