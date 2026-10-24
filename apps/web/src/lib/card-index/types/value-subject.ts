import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type ValueSubject =
	{ kind: 'era'; code: EraCode } | { kind: CategoryCode; record: CardIndexRecord };
