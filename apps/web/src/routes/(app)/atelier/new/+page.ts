import { loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadNoteLinks } from '#lib/collection/note-link-data.ts';
import { loadPlaceStarter } from '#lib/collection/place-starter.ts';
import { loadValueLinks } from '#lib/collection/value-links.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [categories, linked, noteLinks, placeStarter] = await Promise.all([
		loadCategoryValues(),
		loadValueLinks(),
		loadNoteLinks(),
		loadPlaceStarter()
	]);
	return { values: categories.values, links: linked.links, noteLinks, placeStarter };
};
