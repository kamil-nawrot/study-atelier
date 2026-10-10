import { supabase } from '#lib/supabase.ts';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ depends }) => {
	depends('supabase:auth');
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return { session };
};
