<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, TextField } from '@study-atelier/ui';
	import AuthForm from '#lib/auth/AuthForm.svelte';
	import AuthLayout from '#lib/auth/AuthLayout.svelte';
	import { authErrorMessage } from '#lib/auth/errors.ts';
	import { MIN_PASSWORD_LENGTH, validateNewPassword } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let password = $state('');
	let passwordError = $state<string>();
	let formError = $state<string>();
	let submitting = $state(false);

	async function save(): Promise<void> {
		passwordError = validateNewPassword(password);
		formError = undefined;
		if (passwordError) return;

		submitting = true;
		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			formError = authErrorMessage(error);
			submitting = false;
			return;
		}
		await goto(resolve('/(app)'), { invalidateAll: true });
	}
</script>

<AuthLayout lead={m.updatePassword.lead} title={m.updatePassword.title}>
	{#if data.session}
		<AuthForm onsubmit={save}>
			{#if formError}
				<Alert label={m.alert.danger} title={m.updatePassword.errorTitle} tone="danger">
					{formError}
				</Alert>
			{/if}
			<TextField
				autocomplete="new-password"
				error={passwordError}
				hidePasswordLabel={m.common.hidePassword}
				hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
				label={m.updatePassword.newPassword}
				showPasswordLabel={m.common.showPassword}
				type="password"
				bind:value={password}
			/>
			<Button disabled={submitting} fullWidth type="submit" variant="primary">
				{submitting ? m.updatePassword.submitting : m.updatePassword.submit}
			</Button>
		</AuthForm>
	{:else}
		<Alert label={m.alert.warning} title={m.updatePassword.expiredTitle} tone="warning">
			{m.updatePassword.expired}
		</Alert>
		<Button fullWidth onclick={() => goto(resolve('/(auth)/forgot-password'))} variant="primary">
			{m.updatePassword.requestNew}
		</Button>
	{/if}

	{#snippet footer()}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>
