import type { NoteLinks } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { PlaceStarter } from '#lib/card-index/types/place-starter.ts';
import type { VisitResult } from './visit-result.ts';

export type VisitFormData = VisitResult & {
	artworks: WallArtwork[];
	places: string[];
	placeStarter?: PlaceStarter;
	noteLinks?: NoteLinks;
};
