import type { CategoryCode } from './category-code.ts';

export type CardIndexRecord = {
	id: string;
	category: CategoryCode;
	name: string;
	count: number;
	visits?: number;
	sortName?: string;
	birthYear?: number;
	countryCode?: string;
};
