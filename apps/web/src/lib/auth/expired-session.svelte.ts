import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type ServiceErrorLike = {
	code?: string;
	message?: string;
	status?: number;
};

const authorizationCodes = new Set(['PGRST301', 'PGRST302', 'PGRST303']);

export const sessionEnded = $state({ value: false });

export function isAuthorizationError(error: ServiceErrorLike): boolean {
	return error.status === 401 || (error.code !== undefined && authorizationCodes.has(error.code));
}

export async function failureMessage(
	error: ServiceErrorLike,
	messageFor: (error: ServiceErrorLike) => string
): Promise<string> {
	if (!isAuthorizationError(error)) return messageFor(error);
	sessionEnded.value = true;
	await supabase.auth.signOut();
	return m.authErrors.sessionEnded;
}
