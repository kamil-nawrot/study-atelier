import { loadDisplayCase } from '#lib/career/career-data/career-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadDisplayCase();
