import { loadTrash } from '#lib/wall/wall-data/wall-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadTrash();
