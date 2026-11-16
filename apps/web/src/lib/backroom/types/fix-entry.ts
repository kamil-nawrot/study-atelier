import type { FixField } from './fix-field.ts';

export type FixEntry = {
	key: string;
	path: string;
	field: FixField;
	note: string;
	flagId?: string;
};
