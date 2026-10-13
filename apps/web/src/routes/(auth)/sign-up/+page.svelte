<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Alert, Button, Form, TextField } from '@study-atelier/ui';
	import { signUp } from '#lib/auth/account.ts';
	import AuthLayout from '#lib/auth/components/AuthLayout.svelte';
	import { MIN_PASSWORD_LENGTH, validateEmail, validateNewPassword } from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';

	let email = $state('');
	let password = $state('');
	let emailError = $state<string>();
	let passwordError = $state<string>();
	let formError = $state<string>();
	let accountExists = $state(false);
	let submitting = $state(false);

	async function submit(): Promise<void> {
		emailError = validateEmail(email);
		passwordError = validateNewPassword(password);
		formError = undefined;
		accountExists = false;
		if (emailError || passwordError) return;

		submitting = true;
		const address = email.trim();
		const result = await signUp(address, password);
		if (result.accountExists) {
			accountExists = true;
			submitting = false;
			return;
		}
		if (result.error) {
			formError = result.error;
			submitting = false;
			return;
		}
		if (result.signedIn) {
			await goto(resolve('/(app)/atelier'), { invalidateAll: true });
			return;
		}
		await goto(resolve('/(auth)/sign-up/check-email'), { state: { email: address } });
	}
</script>

<AuthLayout lead={m.signUp.lead} title={m.signUp.title}>
	<Form onsubmit={submit}>
		{#if accountExists}
			<Alert title={m.signUp.errorTitle} tone="danger">
				<p>{m.signUp.accountExists}</p>
				<p class="links">
					<a href={resolve('/(auth)/sign-in')}>{m.signUp.toSignIn}</a>
					<a href={resolve('/(auth)/forgot-password')}>{m.signUp.forgotPassword}</a>
				</p>
			</Alert>
		{:else if formError}
			<Alert title={m.signUp.errorTitle} tone="danger">{formError}</Alert>
		{/if}
		<TextField
			autocomplete="email"
			error={emailError}
			label={m.common.email}
			type="email"
			bind:value={email}
		/>
		<TextField
			autocomplete="new-password"
			error={passwordError}
			hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
			label={m.common.password}
			type="password"
			bind:value={password}
		/>
		<Button disabled={submitting} fullWidth type="submit" variant="primary">
			{submitting ? m.signUp.submitting : m.signUp.submit}
		</Button>
	</Form>

	{#snippet footer()}
		<p>{m.signUp.haveAccount}</p>
		<Button fullWidth href={resolve('/(auth)/sign-in')}>{m.signUp.toSignIn}</Button>
	{/snippet}
</AuthLayout>

<style>
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-4);
	}
</style>
