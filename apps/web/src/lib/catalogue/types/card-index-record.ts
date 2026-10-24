import type { CategoryCode } from './category-code.ts';

export type CardIndexRecord = {
	id: string;
	category: CategoryCode;
	name: string;
	count: number;
	sortName?: string;
};
