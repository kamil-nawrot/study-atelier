import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';

export type SuggestionSource = {
	artworks: readonly WallArtwork[];
	tripPlaces: readonly TripPlace[];
};
