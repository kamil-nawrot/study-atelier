import type { Session } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase.ts';

export const SESSION_DEPENDENCY = 'supabase:auth';

export async function currentSession(): Promise<Session | null> {
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return session;
}

export function watchSession(current: () => Session | null, onChange: () => void): () => void {
	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((_event, session) => {
		if (session?.access_token !== current()?.access_token) {
			onChange();
		}
	});
	return () => subscription.unsubscribe();
}
