import { loadStatistics } from '#lib/statistics/statistics-page-data/statistics-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadStatistics();
