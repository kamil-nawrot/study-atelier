import { loadSymbolForm } from '#lib/symbols/symbol-page-data/symbol-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadSymbolForm();
