import { loadExhibitionList } from '#lib/exhibitions/exhibition-page-data/exhibition-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadExhibitionList();
