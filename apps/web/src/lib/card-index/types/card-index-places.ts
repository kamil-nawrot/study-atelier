import type { CardIndexCountry } from './card-index-country.ts';
import type { CardIndexPlaceGroup } from './card-index-place-group.ts';

export type CardIndexPlaces = {
	countries: CardIndexCountry[];
	withoutCountry: CardIndexPlaceGroup[];
};
