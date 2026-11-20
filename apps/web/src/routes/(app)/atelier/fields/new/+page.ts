import { loadNewOwnFieldPage } from '#lib/card-index/own-field-pages/own-field-pages.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadNewOwnFieldPage();
