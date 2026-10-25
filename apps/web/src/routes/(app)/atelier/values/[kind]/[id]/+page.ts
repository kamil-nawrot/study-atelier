import { loadValuePage } from '#lib/values/value-page-data/value-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => loadValuePage(params.kind, params.id, true);
