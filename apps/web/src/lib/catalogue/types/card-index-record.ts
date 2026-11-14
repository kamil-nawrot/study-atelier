import type { CategoryCode } from './category-code.ts';
import type { PlaceType } from './place-type.ts';

export type CardIndexRecord = {
	id: string;
	category: CategoryCode;
	name: string;
	count: number;
	visits?: number;
	sortName?: string;
	birthYear?: number;
	countryCode?: string;
	placeType?: PlaceType;
	cityId?: string;
};
