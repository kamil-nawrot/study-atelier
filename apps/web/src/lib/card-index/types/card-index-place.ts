import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { CardIndexEntry } from './card-index-entry.ts';

export type CardIndexPlace = CardIndexEntry & {
	placeType?: PlaceType;
};
