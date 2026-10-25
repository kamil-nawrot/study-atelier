import type { FilterField } from './filter-field.ts';
import type { OwnFilterKind } from './own-filter-kind.ts';
import type { TagParts } from './tag-parts.ts';

export type FilterTag = {
	id: string;
	field: FilterField | OwnFilterKind;
	value: string;
	fieldId?: string;
	parts?: TagParts;
};
