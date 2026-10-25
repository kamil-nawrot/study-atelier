import { loadChronicle } from '#lib/chronicle/chronicle-page-data/chronicle-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadChronicle();
