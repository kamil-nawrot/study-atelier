<script lang="ts">
	import { Alert, Button, Checkbox, Form, TextField } from '@study-atelier/ui';
	import { changePassword, requestEmailChange } from '#lib/auth/account.ts';
	import {
		MIN_PASSWORD_LENGTH,
		validateEmail,
		validateNewPassword,
		validateRequiredPassword
	} from '#lib/auth/validation.ts';
	import { m } from '#lib/i18n/index.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';

	type Props = {
		email: string;
		pendingEmail?: string;
		onchanged: (message: string) => void;
	};

	let { email, pendingEmail, onchanged }: Props = $props();

	let newEmail = $state('');
	let emailFieldError = $state<string>();
	let emailSent = $state(false);
	const emailForm = new FormState(null);

	let currentPassword = $state('');
	let newPassword = $state('');
	let signOutOthers = $state(true);
	let currentError = $state<string>();
	let newError = $state<string>();
	let othersError = $state('');
	const passwordForm = new FormState(null);

	function submitEmail(): Promise<void> {
		return emailForm.run(async () => {
			emailFieldError = validateEmail(newEmail);
			if (emailFieldError) return;
			const result = await requestEmailChange(email, newEmail);
			if (!result.sent) {
				emailFieldError = result.error;
				return;
			}
			emailSent = true;
		});
	}

	function submit(): Promise<void> {
		return passwordForm.run(async () => {
			othersError = '';
			currentError = validateRequiredPassword(currentPassword);
			newError = validateNewPassword(newPassword);
			if (currentError || newError) return;
			const result = await changePassword(email, currentPassword, newPassword, signOutOthers);
			currentError = result.currentError;
			newError = result.newError;
			if (result.error) passwordForm.error = result.error;
			if (!result.changed) return;
			currentPassword = '';
			newPassword = '';
			if (result.othersError) {
				othersError = result.othersError;
				return;
			}
			onchanged(m.settings.account.changed);
		});
	}
</script>

<div class="account">
	<section>
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
				<Button disabled={emailForm.busy} type="submit">
					{emailForm.busy ? m.settings.account.emailSubmitting : m.settings.account.emailSubmit}
				</Button>
			</div>
		</Form>
	</section>
	<section class="rule">
		<h2>{m.settings.account.passwordTitle}</h2>
		<Form error={passwordForm.error} errorTitle={m.settings.account.errorTitle} onsubmit={submit}>
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
				<Button disabled={passwordForm.busy} type="submit">
					{passwordForm.busy ? m.settings.account.submitting : m.settings.account.submit}
				</Button>
			</div>
		</Form>
	</section>
</div>

<style>
	.account {
		display: grid;
		gap: var(--spacing-8);
		width: 100%;
		max-width: var(--size-content-default);
	}

	section {
		display: grid;
		gap: var(--spacing-6);
	}

	.rule {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.actions {
		display: flex;
	}
</style>
