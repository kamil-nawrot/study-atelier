import { loadVisitForm } from '#lib/chronicle/visit-form-data/visit-form-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadVisitForm();
