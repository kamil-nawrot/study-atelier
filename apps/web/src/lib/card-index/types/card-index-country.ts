import type { CardIndexPlaceGroup } from './card-index-place-group.ts';

export type CardIndexCountry = {
	code: string;
	name: string;
	count: number;
	groups: CardIndexPlaceGroup[];
};
