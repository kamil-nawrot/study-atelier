<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Button, TextField } from '@study-atelier/ui';
	import AuthForm from '#lib/auth/AuthForm.svelte';
	import AuthLayout from '#lib/auth/AuthLayout.svelte';
	import { authErrorMessage } from '#lib/auth/errors.ts';
	import { authRedirectUrl } from '#lib/auth/redirects.ts';
	import { validateEmail } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';

	let email = $state('');
	let emailError = $state<string>();
	let formError = $state<string>();
	let sentTo = $state<string>();
	let submitting = $state(false);

	async function sendLink(): Promise<void> {
		emailError = validateEmail(email);
		formError = undefined;
		if (emailError) return;

		submitting = true;
		const address = email.trim();
		const { error } = await supabase.auth.resetPasswordForEmail(address, {
			redirectTo: authRedirectUrl('/update-password')
		});
		submitting = false;
		if (error) {
			formError = authErrorMessage(error);
			return;
		}
		sentTo = address;
	}
</script>

<AuthLayout lead={m.forgotPassword.lead} title={m.forgotPassword.title}>
	{#if sentTo}
		<Alert label={m.alert.success} title={m.forgotPassword.sentTitle} tone="success">
			{m.forgotPassword.sent(sentTo)}
		</Alert>
	{:else}
		<AuthForm onsubmit={sendLink}>
			{#if formError}
				<Alert label={m.alert.danger} title={m.forgotPassword.errorTitle} tone="danger">
					{formError}
				</Alert>
			{/if}
			<TextField
				autocomplete="email"
				error={emailError}
				label={m.common.email}
				type="email"
				bind:value={email}
			/>
			<Button disabled={submitting} fullWidth type="submit" variant="primary">
				{submitting ? m.forgotPassword.submitting : m.forgotPassword.submit}
			</Button>
		</AuthForm>
	{/if}

	{#snippet footer()}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>
