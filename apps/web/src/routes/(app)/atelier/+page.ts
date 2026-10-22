import { loadAtelier } from '#lib/collection/artworks.ts';
import { loadOwnFieldDefinitions } from '#lib/collection/own-fields.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [atelier, own] = await Promise.all([loadAtelier(), loadOwnFieldDefinitions()]);
	return { ...atelier, ownFields: own.fields };
};
