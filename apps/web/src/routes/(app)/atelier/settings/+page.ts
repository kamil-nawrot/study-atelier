import { loadProfile } from '#lib/profile/profile-data.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => loadProfile();
