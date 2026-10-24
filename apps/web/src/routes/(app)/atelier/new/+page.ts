import { loadCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields/own-fields.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [categories, linked, noteLinks, placeStarter, own] = await Promise.all([
		loadCategoryValues(),
		loadValueLinks(),
		loadNoteLinks(),
		loadPlaceStarter(),
		loadOwnFieldDefinitions()
	]);
	return {
		values: categories.values,
		ownValues: categories.ownValues,
		ownFields: own.error ? undefined : own.fields,
		links: linked.links,
		noteLinks,
		placeStarter
	};
};
