import type { FixField } from './fix-field.ts';
import type { FlagTarget } from './flag-target.ts';

export type FixEntry = {
	key: string;
	path: string;
	field: FixField;
	note: string;
	flagIds?: string[];
	target?: FlagTarget;
};
