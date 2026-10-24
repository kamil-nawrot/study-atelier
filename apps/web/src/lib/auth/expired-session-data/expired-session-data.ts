import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	isAuthorizationError,
	sessionEnded
} from '#lib/auth/expired-session/expired-session.svelte.ts';
import type { ServiceErrorLike } from '#lib/auth/types/service-error-like.ts';

export async function failureMessage(
	error: ServiceErrorLike,
	messageFor: (error: ServiceErrorLike) => string
): Promise<string> {
	if (!isAuthorizationError(error)) return messageFor(error);
	sessionEnded.value = true;
	await supabase.auth.signOut();
	return m.authErrors.sessionEnded;
}
