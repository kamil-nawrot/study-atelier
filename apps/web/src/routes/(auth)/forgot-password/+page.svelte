<script lang="ts">
	import { resolve } from '$app/paths';
	import { Alert, Button, Form, TextField } from '@study-atelier/ui';
	import { requestPasswordReset } from '#lib/auth/account-data/account-data.ts';
	import AuthLayout from '#lib/auth/components/AuthLayout/AuthLayout.svelte';
	import { validateEmail } from '#lib/auth/validation/validation.ts';
	import { m } from '#lib/i18n/i18n.ts';

	let email = $state('');
	let emailError = $state<string>();
	let formError = $state<string>();
	let sentTo = $state<string>();
	let submitting = $state(false);

	async function submit(): Promise<void> {
		emailError = validateEmail(email);
		formError = undefined;
		if (emailError) return;

		submitting = true;
		const address = email.trim();
		formError = await requestPasswordReset(address);
		submitting = false;
		if (!formError) sentTo = address;
	}
</script>

<AuthLayout lead={m.forgotPassword.lead} title={m.forgotPassword.title}>
	{#if sentTo}
		<Alert title={m.forgotPassword.sentTitle} tone="success">
			{m.forgotPassword.sent(sentTo)}
		</Alert>
	{:else}
		<Form onsubmit={submit}>
			{#if formError}
				<Alert title={m.forgotPassword.errorTitle} tone="danger">
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
		</Form>
	{/if}

	{#snippet footer()}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>
