<script lang="ts">
	import { Alert, Button, Dialog, Form, TextField } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { deleteAccount } from '#lib/auth/account-data/account-data.ts';
	import Turnstile from '#lib/auth/components/Turnstile/Turnstile.svelte';

	type Props = {
		email: string;
		open: boolean;
		ondeleted: () => void | Promise<void>;
	};

	let { email, open = $bindable(), ondeleted }: Props = $props();

	const formId = $props.id();

	let password = $state('');
	let passwordError = $state<string>();
	let failure = $state<string>();
	let deleting = $state(false);
	let turnstile = $state<Turnstile>();

	$effect(() => {
		if (!open) return;
		password = '';
		passwordError = undefined;
		failure = undefined;
	});

	async function submit(): Promise<void> {
		if (deleting || !password) return;
		deleting = true;
		passwordError = undefined;
		failure = undefined;
		const result = await deleteAccount(email, password, await turnstile?.getToken());
		if (!result.deleted) {
			turnstile?.reset();
			deleting = false;
			passwordError = result.passwordError;
			failure = result.error;
			return;
		}
		await ondeleted();
	}
</script>

<Dialog
	description={m.settings.account.deleteConfirmDescription}
	size="small"
	title={m.settings.account.deleteConfirmTitle}
	bind:open
>
	<Form id={formId} onsubmit={submit}>
		{#if failure}
			<Alert tone="danger">{failure}</Alert>
		{/if}
		<a href="{resolve('/(app)/atelier/settings')}?tab=data">{m.settings.account.deleteToData}</a>
		<TextField
			autocomplete="current-password"
			error={passwordError}
			label={m.settings.account.deletePassword}
			type="password"
			bind:value={password}
		/>
		<Turnstile bind:this={turnstile} />
	</Form>
	{#snippet footer()}
		<Button onclick={() => (open = false)}>
			{m.common.cancel}
		</Button>
		<Button disabled={deleting || !password} form={formId} type="submit" variant="danger">
			{deleting ? m.settings.account.deleting : m.settings.account.deleteSubmit}
		</Button>
	{/snippet}
</Dialog>
