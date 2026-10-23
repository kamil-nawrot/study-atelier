import { ATELIER_EMPTY_DEPENDENCY, loadAtelierEmpty } from '#lib/import/import-data.ts';
import { loadProfile } from '#lib/profile/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
	depends(ATELIER_EMPTY_DEPENDENCY);
	const [profile, atelierEmpty] = await Promise.all([loadProfile(), loadAtelierEmpty()]);
	return { ...profile, atelierEmpty };
};
