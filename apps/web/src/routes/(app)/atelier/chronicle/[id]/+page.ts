import { loadVisitPage } from '#lib/chronicle/chronicle-page-data/chronicle-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => loadVisitPage(params.id);
