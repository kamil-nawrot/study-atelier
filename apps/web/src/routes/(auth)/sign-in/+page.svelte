<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, Form, TextField } from '@study-atelier/ui';
	import { accountDeleted } from '#lib/auth/account-deleted/account-deleted.svelte.ts';
	import { sessionEnded } from '#lib/auth/expired-session/expired-session.svelte.ts';
	import { signIn } from '#lib/auth/account-data/account-data.ts';
	import AuthLayout from '#lib/auth/components/AuthLayout/AuthLayout.svelte';
	import { validateEmail, validateRequiredPassword } from '#lib/auth/validation/validation.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';

	let email = $state('');
	let password = $state('');
	let emailError = $state<string>();
	let passwordError = $state<string>();
	let formError = $state<string>();
	let submitting = $state(false);

	async function submit(): Promise<void> {
		emailError = validateEmail(email);
		passwordError = validateRequiredPassword(password);
		formError = undefined;
		sessionEnded.value = false;
		accountDeleted.value = false;
		if (emailError || passwordError) return;

		submitting = true;
		formError = await signIn(email.trim(), password);
		if (formError) {
			submitting = false;
			return;
		}
		await goto(resolve('/(app)/atelier'), { invalidateAll: true });
	}
</script>

<AuthLayout lead={m.signIn.lead} title={m.signIn.title}>
	<Form onsubmit={submit}>
		{#if accountDeleted.value && !formError}
			<Alert tone="success">{m.settings.account.deleted}</Alert>
		{/if}
		{#if sessionEnded.value && !formError}
			<Alert tone="warning">{m.authErrors.sessionEnded}</Alert>
		{/if}
		{#if formError}
			<Alert title={m.signIn.errorTitle} tone="danger">{formError}</Alert>
		{/if}
		<TextField
			autocomplete="email"
			error={emailError}
			label={m.common.email}
			type="email"
			bind:value={email}
		/>
		<TextField
			autocomplete="current-password"
			error={passwordError}
			label={m.common.password}
			type="password"
			bind:value={password}
		>
			{#snippet labelAside()}
				<a class="caption" href={resolve('/(auth)/forgot-password')}>{m.signIn.forgotPassword}</a>
			{/snippet}
		</TextField>
		<Button disabled={submitting} fullWidth type="submit" variant="primary">
			{submitting ? m.signIn.submitting : m.signIn.submit}
		</Button>
	</Form>

	{#snippet footer()}
		<p>{m.signIn.noAccount}</p>
		<Button fullWidth href={resolve('/(auth)/sign-up')}>{m.signIn.toSignUp}</Button>
		<LegalLinks />
	{/snippet}
</AuthLayout>
