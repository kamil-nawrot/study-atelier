import { loadTrash } from '#lib/collection/artworks.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadTrash();
