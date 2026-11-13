import type { NoteLinks } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { Town } from '#lib/map/types/town.ts';
import type { TripPlace } from './trip-place.ts';
import type { Visit } from './visit.ts';
import type { VisitResult } from './visit-result.ts';

export type VisitFormData = VisitResult & {
	artworks: WallArtwork[];
	places: string[];
	tripPlaces: TripPlace[];
	towns: Town[];
	trips: Visit[];
	placeStarter?: PlaceStarter;
	noteLinks?: NoteLinks;
};
