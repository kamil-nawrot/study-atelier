<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, TextField } from '@study-atelier/ui';
	import AuthForm from '#lib/auth/AuthForm.svelte';
	import AuthLayout from '#lib/auth/AuthLayout.svelte';
	import { authErrorMessage } from '#lib/auth/errors.ts';
	import { validateEmail, validateRequiredPassword } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';

	let email = $state('');
	let password = $state('');
	let emailError = $state<string>();
	let passwordError = $state<string>();
	let formError = $state<string>();
	let submitting = $state(false);

	async function signIn(): Promise<void> {
		emailError = validateEmail(email);
		passwordError = validateRequiredPassword(password);
		formError = undefined;
		if (emailError || passwordError) return;

		submitting = true;
		const { error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password
		});
		if (error) {
			formError = authErrorMessage(error);
			submitting = false;
			return;
		}
		await goto(resolve('/(app)'), { invalidateAll: true });
	}
</script>

<AuthLayout lead={m.signIn.lead} title={m.signIn.title}>
	<AuthForm onsubmit={signIn}>
		{#if formError}
			<Alert label={m.alert.danger} title={m.signIn.errorTitle} tone="danger">{formError}</Alert>
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
			hidePasswordLabel={m.common.hidePassword}
			label={m.common.password}
			showPasswordLabel={m.common.showPassword}
			type="password"
			bind:value={password}
		>
			{#snippet labelAside()}
				<a class="aside" href={resolve('/(auth)/forgot-password')}>{m.signIn.forgotPassword}</a>
			{/snippet}
		</TextField>
		<Button disabled={submitting} fullWidth type="submit" variant="primary">
			{submitting ? m.signIn.submitting : m.signIn.submit}
		</Button>
	</AuthForm>

	{#snippet footer()}
		<p>{m.signIn.noAccount}</p>
		<Button fullWidth onclick={() => goto(resolve('/(auth)/sign-up'))}>{m.signIn.toSignUp}</Button>
	{/snippet}
</AuthLayout>

<style>
	.aside {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
	}

	p {
		margin: 0;
	}
</style>
