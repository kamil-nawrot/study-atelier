import { loadCategoryValues } from '#lib/collection/category-values.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadCategoryValues();
