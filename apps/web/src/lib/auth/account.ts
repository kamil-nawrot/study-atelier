import { supabase } from '#lib/supabase.ts';
import { authErrorMessage } from './errors.ts';
import { authRedirectUrl } from './redirects.ts';

export type SignUpResult = {
	error?: string;
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

export async function signOut(): Promise<void> {
	await supabase.auth.signOut();
}
