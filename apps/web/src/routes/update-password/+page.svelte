<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, Form, TextField } from '@study-atelier/ui';
	import { updatePassword } from '#lib/auth/account.ts';
	import AuthLayout from '#lib/auth/components/AuthLayout.svelte';
	import { MIN_PASSWORD_LENGTH, validateNewPassword } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let password = $state('');
	let passwordError = $state<string>();
	let formError = $state<string>();
	let submitting = $state(false);

	async function submit(): Promise<void> {
		passwordError = validateNewPassword(password);
		formError = undefined;
		if (passwordError) return;

		submitting = true;
		formError = await updatePassword(password);
		if (formError) {
			submitting = false;
			return;
		}
		await goto(resolve('/(app)/atelier'), { invalidateAll: true });
	}
</script>

<AuthLayout lead={m.updatePassword.lead} title={m.updatePassword.title}>
	{#if data.session}
		<Form onsubmit={submit}>
			{#if formError}
				<Alert title={m.updatePassword.errorTitle} tone="danger">
					{formError}
				</Alert>
			{/if}
			<TextField
				autocomplete="new-password"
				error={passwordError}
				hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
				label={m.updatePassword.newPassword}
				type="password"
				bind:value={password}
			/>
			<Button disabled={submitting} fullWidth type="submit" variant="primary">
				{submitting ? m.updatePassword.submitting : m.updatePassword.submit}
			</Button>
		</Form>
	{:else}
		<Alert title={m.updatePassword.expiredTitle} tone="warning">
			{m.updatePassword.expired}
		</Alert>
		<Button fullWidth href={resolve('/(auth)/forgot-password')} variant="primary">
			{m.updatePassword.requestNew}
		</Button>
	{/if}

	{#snippet footer()}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>
