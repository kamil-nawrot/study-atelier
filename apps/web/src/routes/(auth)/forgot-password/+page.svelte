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

	async function sendLink() {
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

<AuthLayout title={m.forgotPassword.title} lead={m.forgotPassword.lead}>
	{#if sentTo}
		<Alert tone="success" label={m.alert.success} title={m.forgotPassword.sentTitle}>
			{m.forgotPassword.sent(sentTo)}
		</Alert>
	{:else}
		<AuthForm onsubmit={sendLink}>
			{#if formError}
				<Alert tone="danger" label={m.alert.danger} title={m.forgotPassword.errorTitle}
					>{formError}</Alert
				>
			{/if}
			<TextField
				label={m.common.email}
				type="email"
				autocomplete="email"
				bind:value={email}
				error={emailError}
			/>
			<Button type="submit" variant="primary" fullWidth disabled={submitting}>
				{submitting ? m.forgotPassword.submitting : m.forgotPassword.submit}
			</Button>
		</AuthForm>
	{/if}

	{#snippet footer()}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>

<style>
	a {
		color: var(--color-fg);
	}
</style>
