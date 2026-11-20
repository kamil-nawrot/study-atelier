import {
	loadGlossaryForm,
	requestedKind
} from '#lib/glossary/glossary-page-data/glossary-page-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) =>
	loadGlossaryForm(undefined, requestedKind(url.searchParams.get('kind')));
