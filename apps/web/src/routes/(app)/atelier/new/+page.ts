import { loadOwnFieldDefinitions } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const own = await loadOwnFieldDefinitions();
	return { ownFields: own.error ? undefined : own.fields };
};
