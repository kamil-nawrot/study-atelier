import { loadValuePage } from '#lib/collection/value-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => loadValuePage(params.kind, params.id, false);
