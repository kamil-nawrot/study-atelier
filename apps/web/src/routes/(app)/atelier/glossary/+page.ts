import { loadGlossary } from '#lib/glossary/glossary-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadGlossary();
