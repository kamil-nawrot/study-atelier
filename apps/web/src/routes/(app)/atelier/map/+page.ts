import { loadMap } from '#lib/map/map-page-data/map-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadMap();
