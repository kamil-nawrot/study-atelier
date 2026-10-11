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

	async function resend() {
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

<AuthLayout title={m.checkEmail.title} lead={m.checkEmail.lead}>
	<Alert tone="success" label={m.alert.success} title={m.checkEmail.sentTitle}>
		{email ? m.checkEmail.sent(email) : m.checkEmail.sentNoEmail}
	</Alert>

	{#snippet footer()}
		{#if email}
			<p>{m.checkEmail.notReceived}</p>
			{#if resent}
				<Alert tone="success" label={m.alert.success}>{m.checkEmail.resent}</Alert>
			{/if}
			{#if resendError}
				<Alert tone="danger" label={m.alert.danger}>{resendError}</Alert>
			{/if}
			<Button fullWidth onclick={resend} disabled={resending}>
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

	a {
		color: var(--color-fg);
	}
</style>
