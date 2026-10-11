<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Alert, Button } from '@study-atelier/ui';
	import AuthLayout from '#lib/auth/AuthLayout.svelte';
	import { authErrorMessage } from '#lib/auth/errors.ts';
	import { authRedirectUrl } from '#lib/auth/redirects.ts';
	import { m } from '#lib/i18n/index.ts';
	import { supabase } from '#lib/supabase.ts';

	const email = page.state.email ?? '';

	let resending = $state(false);
	let resent = $state(false);
	let resendError = $state<string>();

	async function resend(): Promise<void> {
		resending = true;
		resent = false;
		resendError = undefined;
		const { error } = await supabase.auth.resend({
			type: 'signup',
			email,
			options: { emailRedirectTo: authRedirectUrl('/') }
		});
		resending = false;
		if (error) {
			resendError = authErrorMessage(error);
			return;
		}
		resent = true;
	}
</script>

<AuthLayout lead={m.checkEmail.lead} title={m.checkEmail.title}>
	<Alert label={m.alert.success} title={m.checkEmail.sentTitle} tone="success">
		{email ? m.checkEmail.sent(email) : m.checkEmail.sentNoEmail}
	</Alert>

	{#snippet footer()}
		{#if email}
			<p>{m.checkEmail.notReceived}</p>
			{#if resent}
				<Alert label={m.alert.success} tone="success">{m.checkEmail.resent}</Alert>
			{/if}
			{#if resendError}
				<Alert label={m.alert.danger} tone="danger">{resendError}</Alert>
			{/if}
			<Button disabled={resending} fullWidth onclick={resend}>
				{resending ? m.checkEmail.resending : m.checkEmail.resend}
			</Button>
		{/if}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>

<style>
	p {
		margin: 0;
	}
</style>
