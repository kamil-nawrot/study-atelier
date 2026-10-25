import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [atelier, own] = await Promise.all([loadAtelier(), loadOwnFieldDefinitions()]);
	return { ...atelier, ownFields: own.error ? undefined : own.fields };
};
