import { loadGlossaryForm } from '#lib/glossary/glossary-page-data/glossary-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadGlossaryForm();
