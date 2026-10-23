import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { authErrorMessage } from './errors.ts';
import { authRedirectUrl } from './redirects.ts';

export type SignUpResult = {
	error?: string;
	accountExists?: boolean;
	signedIn: boolean;
};

export async function signIn(email: string, password: string): Promise<string | undefined> {
	const { error } = await supabase.auth.signInWithPassword({ email, password });
	return error ? authErrorMessage(error) : undefined;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { emailRedirectTo: authRedirectUrl('/') }
	});
	if (error?.code === 'user_already_exists' || data.user?.identities?.length === 0) {
		return { accountExists: true, signedIn: false };
	}
	if (error) return { error: authErrorMessage(error), signedIn: false };
	return { signedIn: data.session !== null };
}

export async function resendConfirmation(email: string): Promise<string | undefined> {
	const { error } = await supabase.auth.resend({
		type: 'signup',
		email,
		options: { emailRedirectTo: authRedirectUrl('/') }
	});
	return error ? authErrorMessage(error) : undefined;
}

export async function requestPasswordReset(email: string): Promise<string | undefined> {
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: authRedirectUrl('/update-password')
	});
	return error ? authErrorMessage(error) : undefined;
}

export async function updatePassword(password: string): Promise<string | undefined> {
	const { error } = await supabase.auth.updateUser({ password });
	return error ? authErrorMessage(error) : undefined;
}

export type PasswordChangeResult = {
	changed: boolean;
	currentError?: string;
	newError?: string;
	error?: string;
};

export async function changePassword(
	email: string,
	currentPassword: string,
	newPassword: string,
	signOutOthers: boolean
): Promise<PasswordChangeResult> {
	if (newPassword === currentPassword) {
		return { changed: false, newError: m.settings.account.sameAsCurrent };
	}
	const verified = await supabase.auth.signInWithPassword({ email, password: currentPassword });
	if (verified.error) {
		if (verified.error.code === 'invalid_credentials') {
			return { changed: false, currentError: m.settings.account.wrongCurrent };
		}
		return { changed: false, error: authErrorMessage(verified.error) };
	}
	const { error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) {
		if (error.code === 'same_password') {
			return { changed: false, newError: m.settings.account.sameAsCurrent };
		}
		if (error.code === 'weak_password') {
			return { changed: false, newError: authErrorMessage(error) };
		}
		return { changed: false, error: authErrorMessage(error) };
	}
	if (signOutOthers) await supabase.auth.signOut({ scope: 'others' });
	return { changed: true };
}

export async function signOut(): Promise<void> {
	await supabase.auth.signOut();
}
