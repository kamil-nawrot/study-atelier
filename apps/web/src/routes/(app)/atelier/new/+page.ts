import { loadCategoryValues } from '#lib/collection/category-values.ts';
import { loadNoteLinks } from '#lib/collection/note-link-data.ts';
import { loadOwnFieldDefinitions } from '#lib/collection/own-fields.ts';
import { loadPlaceStarter } from '#lib/collection/place-starter.ts';
import { loadValueLinks } from '#lib/collection/value-links.ts';
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
