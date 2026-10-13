import { loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadValueLinks } from '#lib/collection/value-links.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [categories, linked] = await Promise.all([loadCategoryValues(), loadValueLinks()]);
	return { values: categories.values, links: linked.links };
};
