<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, TextField } from '@study-atelier/ui';
	import AuthForm from '#lib/auth/AuthForm.svelte';
	import AuthLayout from '#lib/auth/AuthLayout.svelte';
	import { authErrorMessage } from '#lib/auth/errors.ts';
	import { authRedirectUrl } from '#lib/auth/redirects.ts';
	import { MIN_PASSWORD_LENGTH, validateEmail, validateNewPassword } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';

	let email = $state('');
	let password = $state('');
	let emailError = $state<string>();
	let passwordError = $state<string>();
	let formError = $state<string>();
	let submitting = $state(false);

	async function signUp(): Promise<void> {
		emailError = validateEmail(email);
		passwordError = validateNewPassword(password);
		formError = undefined;
		if (emailError || passwordError) return;

		submitting = true;
		const address = email.trim();
		const { data, error } = await supabase.auth.signUp({
			email: address,
			password,
			options: { emailRedirectTo: authRedirectUrl('/') }
		});
		if (error) {
			formError = authErrorMessage(error);
			submitting = false;
			return;
		}
		if (data.session) {
			await goto(resolve('/(app)'), { invalidateAll: true });
			return;
		}
		await goto(resolve('/(auth)/sign-up/check-email'), { state: { email: address } });
	}
</script>

<AuthLayout lead={m.signUp.lead} title={m.signUp.title}>
	<AuthForm onsubmit={signUp}>
		{#if formError}
			<Alert label={m.alert.danger} title={m.signUp.errorTitle} tone="danger">{formError}</Alert>
		{/if}
		<TextField
			autocomplete="email"
			error={emailError}
			label={m.common.email}
			type="email"
			bind:value={email}
		/>
		<TextField
			autocomplete="new-password"
			error={passwordError}
			hidePasswordLabel={m.common.hidePassword}
			hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
			label={m.common.password}
			showPasswordLabel={m.common.showPassword}
			type="password"
			bind:value={password}
		/>
		<Button disabled={submitting} fullWidth type="submit" variant="primary">
			{submitting ? m.signUp.submitting : m.signUp.submit}
		</Button>
	</AuthForm>

	{#snippet footer()}
		<p>{m.signUp.haveAccount}</p>
		<Button fullWidth onclick={() => goto(resolve('/(auth)/sign-in'))}>{m.signUp.toSignIn}</Button>
	{/snippet}
</AuthLayout>

<style>
	p {
		margin: 0;
	}
</style>
