import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';

export type LearnerValue = {
	category: CategoryCode;
	name: string;
	wikidataId: string | null;
};
