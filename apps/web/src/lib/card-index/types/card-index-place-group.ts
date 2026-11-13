import type { CardIndexPlace } from './card-index-place.ts';

export type CardIndexPlaceGroup = CardIndexPlace & {
	city: boolean;
	places: CardIndexPlace[];
};
