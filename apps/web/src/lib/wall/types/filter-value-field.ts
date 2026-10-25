import type { FilterField } from '#lib/catalogue/types/filter-field.ts';

export type FilterValueField = Exclude<FilterField, 'years' | 'favourites'>;
