<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Button, Message, TextField } from '@study-atelier/ui';
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

	async function signIn() {
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

<AuthLayout title={m.signIn.title} lead={m.signIn.lead}>
	<AuthForm onsubmit={signIn}>
		{#if formError}
			<Message title={m.signIn.errorTitle}>{formError}</Message>
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
			autocomplete="current-password"
			showPasswordLabel={m.common.showPassword}
			hidePasswordLabel={m.common.hidePassword}
			bind:value={password}
			error={passwordError}
		>
			{#snippet labelAside()}
				<a class="aside" href={resolve('/(auth)/forgot-password')}>{m.signIn.forgotPassword}</a>
			{/snippet}
		</TextField>
		<Button type="submit" variant="primary" fullWidth disabled={submitting}>
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
