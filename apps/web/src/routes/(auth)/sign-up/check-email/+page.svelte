<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Alert, Button } from '@study-atelier/ui';
	import { resendConfirmation } from '#lib/auth/account/account.ts';
	import AuthLayout from '#lib/auth/components/AuthLayout/AuthLayout.svelte';
	import { m } from '#lib/i18n/i18n.ts';

	const email = page.state.email ?? '';

	let resending = $state(false);
	let resent = $state(false);
	let resendError = $state<string>();

	async function resend(): Promise<void> {
		resending = true;
		resent = false;
		resendError = await resendConfirmation(email);
		resending = false;
		resent = !resendError;
	}
</script>

<AuthLayout lead={m.checkEmail.lead} title={m.checkEmail.title}>
	<Alert title={m.checkEmail.sentTitle} tone="success">
		{email ? m.checkEmail.sent(email) : m.checkEmail.sentNoEmail}
	</Alert>

	{#snippet footer()}
		{#if email}
			<p>{m.checkEmail.notReceived}</p>
			{#if resent}
				<Alert tone="success">{m.checkEmail.resent}</Alert>
			{/if}
			{#if resendError}
				<Alert tone="danger">{resendError}</Alert>
			{/if}
			<Button disabled={resending} fullWidth onclick={resend}>
				{resending ? m.checkEmail.resending : m.checkEmail.resend}
			</Button>
		{/if}
		<a href={resolve('/(auth)/sign-in')}>{m.common.backToSignIn}</a>
	{/snippet}
</AuthLayout>
