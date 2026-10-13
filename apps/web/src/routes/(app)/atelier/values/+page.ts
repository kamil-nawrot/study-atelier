import { loadCardIndex } from '#lib/collection/card-index-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadCardIndex();
