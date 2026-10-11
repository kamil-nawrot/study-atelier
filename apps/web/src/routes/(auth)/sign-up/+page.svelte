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

	async function signUp() {
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

<AuthLayout title={m.signUp.title} lead={m.signUp.lead}>
	<AuthForm onsubmit={signUp}>
		{#if formError}
			<Alert tone="danger" label={m.alert.danger} title={m.signUp.errorTitle}>{formError}</Alert>
		{/if}
		<TextField
			label={m.common.email}
			type="email"
			autocomplete="email"
			bind:value={email}
			error={emailError}
		/>
		<TextField
			label={m.common.password}
			type="password"
			autocomplete="new-password"
			showPasswordLabel={m.common.showPassword}
			hidePasswordLabel={m.common.hidePassword}
			hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
			bind:value={password}
			error={passwordError}
		/>
		<Button type="submit" variant="primary" fullWidth disabled={submitting}>
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
