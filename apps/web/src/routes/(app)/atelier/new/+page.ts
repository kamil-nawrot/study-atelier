import { loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadNoteLinks } from '#lib/collection/note-link-data.ts';
import { loadValueLinks } from '#lib/collection/value-links.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [categories, linked, noteLinks] = await Promise.all([
		loadCategoryValues(),
		loadValueLinks(),
		loadNoteLinks()
	]);
	return { values: categories.values, links: linked.links, noteLinks };
};
