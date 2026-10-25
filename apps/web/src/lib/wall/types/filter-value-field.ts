import type { FilterField } from '#lib/catalogue/types/filter-field.ts';
import type { FlagField } from './flag-field.ts';

export type FilterValueField = Exclude<FilterField, 'years' | FlagField>;
