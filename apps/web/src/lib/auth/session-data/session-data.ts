import type { Session } from '@supabase/supabase-js';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

export const SESSION_DEPENDENCY = 'supabase:auth';

export async function currentSession(): Promise<Session | null> {
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return session;
}

function sessionLearner(session: Session | null | undefined): string | undefined {
	return session ? `${session.user.id} ${session.user.email ?? ''}` : undefined;
}

export function watchSession(current: () => Session | null, onChange: () => void): () => void {
	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((_event, session) => {
		if (sessionLearner(session) !== sessionLearner(current())) {
			onChange();
		}
	});
	return () => subscription.unsubscribe();
}
