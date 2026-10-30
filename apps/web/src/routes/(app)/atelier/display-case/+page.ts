import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { loadDisplayCase } from '#lib/career/career-data/career-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { careerShown } = await parent();
	if (careerShown === false) redirect(307, resolve('/(app)/atelier'));
	return loadDisplayCase();
};
