import { loadArchivedExhibitions } from '#lib/exhibitions/exhibition-page-data/exhibition-page-data.ts';
import { loadTrash } from '#lib/wall/wall-data/wall-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const [trash, exhibitions] = await Promise.all([loadTrash(), loadArchivedExhibitions()]);
	return { ...trash, ...exhibitions };
};
