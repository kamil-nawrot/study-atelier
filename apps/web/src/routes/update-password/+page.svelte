<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Button, Message, TextField } from '@study-atelier/ui';
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

	async function save() {
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

<AuthLayout title={m.updatePassword.title} lead={m.updatePassword.lead}>
	{#if data.session}
		<AuthForm onsubmit={save}>
			{#if formError}
				<Message title={m.updatePassword.errorTitle}>{formError}</Message>
			{/if}
			<TextField
				label={m.updatePassword.newPassword}
				type="password"
				autocomplete="new-password"
				showPasswordLabel={m.common.showPassword}
				hidePasswordLabel={m.common.hidePassword}
				hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
				bind:value={password}
				error={passwordError}
			/>
			<Button type="submit" variant="primary" fullWidth disabled={submitting}>
				{submitting ? m.updatePassword.submitting : m.updatePassword.submit}
			</Button>
		</AuthForm>
	{:else}
		<Message tone="warning" title={m.updatePassword.expiredTitle}>
			{m.updatePassword.expired}
		</Message>
		<Button variant="primary" fullWidth onclick={() => goto(resolve('/(auth)/forgot-password'))}>
			{m.updatePassword.requestNew}
		</Button>
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
