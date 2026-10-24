<script lang="ts">
	import { tick } from 'svelte';
	import { Alert, Button, Checkbox, Form, TextField } from '@study-atelier/ui';
	import { changePassword, requestEmailChange } from '#lib/auth/account.ts';
	import {
		MIN_PASSWORD_LENGTH,
		validateEmail,
		validateNewPassword,
		validateRequiredPassword
	} from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';

	type Props = {
		email: string;
		pendingEmail?: string;
		onchanged: (message: string) => void;
	};

	let { email, pendingEmail, onchanged }: Props = $props();

	const formId = $props.id();
	const formErrorId = `${formId}-error`;

	let newEmail = $state('');
	let emailFieldError = $state<string>();
	let emailSent = $state(false);
	let emailBusy = $state(false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let signOutOthers = $state(true);
	let currentError = $state<string>();
	let newError = $state<string>();
	let formError = $state('');
	let othersError = $state('');
	let busy = $state(false);

	async function showError(message: string): Promise<void> {
		formError = message;
		await tick();
		document.getElementById(formErrorId)?.scrollIntoView({ block: 'center' });
	}

	async function submitEmail(): Promise<void> {
		if (emailBusy) return;
		emailFieldError = validateEmail(newEmail);
		if (emailFieldError) return;
		emailBusy = true;
		try {
			const result = await requestEmailChange(email, newEmail);
			if (!result.sent) {
				emailFieldError = result.error;
				return;
			}
			emailSent = true;
		} finally {
			emailBusy = false;
		}
	}

	async function submit(): Promise<void> {
		if (busy) return;
		formError = '';
		othersError = '';
		currentError = validateRequiredPassword(currentPassword);
		newError = validateNewPassword(newPassword);
		if (currentError || newError) return;
		busy = true;
		try {
			const result = await changePassword(email, currentPassword, newPassword, signOutOthers);
			currentError = result.currentError;
			newError = result.newError;
			if (result.error) await showError(result.error);
			if (!result.changed) return;
			currentPassword = '';
			newPassword = '';
			if (result.othersError) {
				othersError = result.othersError;
				return;
			}
			onchanged(m.settings.account.changed);
		} finally {
			busy = false;
		}
	}
</script>

<div class="account">
	<h2>{m.settings.account.emailTitle}</h2>
	<Form onsubmit={submitEmail}>
		{#if emailSent || pendingEmail}
			<Alert title={m.settings.account.emailSentTitle} tone="success">
				{emailSent || !pendingEmail
					? m.settings.account.emailSent
					: m.settings.account.emailPending(pendingEmail)}
			</Alert>
		{/if}
		<TextField
			autocomplete="email"
			error={emailFieldError}
			hint={m.settings.account.currentEmail(email)}
			label={m.settings.account.newEmail}
			type="email"
			bind:value={newEmail}
		/>
		<div class="actions">
			<Button disabled={emailBusy} type="submit">
				{emailBusy ? m.settings.account.emailSubmitting : m.settings.account.emailSubmit}
			</Button>
		</div>
	</Form>
	<h2>{m.settings.account.passwordTitle}</h2>
	<Form onsubmit={submit}>
		{#if formError}
			<Alert id={formErrorId} title={m.settings.account.errorTitle} tone="danger">
				{formError}
			</Alert>
		{/if}
		{#if othersError}
			<Alert title={m.settings.account.othersFailedTitle} tone="warning">
				{othersError}
			</Alert>
		{/if}
		<TextField
			autocomplete="current-password"
			error={currentError}
			label={m.settings.account.currentPassword}
			type="password"
			bind:value={currentPassword}
		/>
		<TextField
			autocomplete="new-password"
			error={newError}
			hint={m.validation.passwordHint(MIN_PASSWORD_LENGTH)}
			label={m.settings.account.newPassword}
			type="password"
			bind:value={newPassword}
		/>
		<Checkbox label={m.settings.account.signOutOthers} bind:checked={signOutOthers} />
		<div class="actions">
			<Button disabled={busy} type="submit">
				{busy ? m.settings.account.submitting : m.settings.account.submit}
			</Button>
		</div>
	</Form>
</div>

<style>
	.account {
		display: grid;
		gap: var(--spacing-6);
		width: 100%;
		max-width: var(--size-content-default);
	}

	.actions {
		display: flex;
	}
</style>
