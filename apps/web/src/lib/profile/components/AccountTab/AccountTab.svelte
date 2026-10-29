<script lang="ts">
	import { Alert, Button, Checkbox, Form, TextField } from '@study-atelier/ui';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { accountDeleted } from '#lib/auth/account-deleted/account-deleted.svelte.ts';
	import { changePassword, requestEmailChange } from '#lib/auth/account-data/account-data.ts';
	import Turnstile from '#lib/auth/components/Turnstile/Turnstile.svelte';
	import {
		MIN_PASSWORD_LENGTH,
		validateEmail,
		validateNewPassword,
		validateRequiredPassword
	} from '#lib/auth/validation/validation.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import AccountDeleteDialog from '#lib/profile/components/AccountDeleteDialog/AccountDeleteDialog.svelte';
	import LegalLinks from '#lib/legal/components/LegalLinks/LegalLinks.svelte';
	import { legalVersionDate } from '#lib/legal/version/version.ts';
	import { FormState } from '#lib/shared/forms/form-state/form-state.svelte.ts';

	type Props = {
		acceptedLegalVersion?: string | null;
		email: string;
		pendingEmail?: string;
		onchanged: (message: string) => void;
	};

	let { acceptedLegalVersion, email, pendingEmail, onchanged }: Props = $props();

	let deleteOpen = $state(false);

	async function accountGone(): Promise<void> {
		accountDeleted.value = true;
		await goto(resolve('/(auth)/sign-in'), { replaceState: true, invalidateAll: true });
	}

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

	let turnstile = $state<Turnstile>();

	function submit(): Promise<void> {
		return passwordForm.run(async () => {
			othersError = '';
			currentError = validateRequiredPassword(currentPassword);
			newError = validateNewPassword(newPassword);
			if (currentError || newError) return;
			const result = await changePassword(
				email,
				currentPassword,
				newPassword,
				signOutOthers,
				await turnstile?.getToken()
			);
			turnstile?.reset();
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
					{emailForm.busy ? m.common.sending : m.settings.account.emailSubmit}
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
			<Turnstile bind:this={turnstile} />
			<div class="actions">
				<Button disabled={passwordForm.busy} type="submit">
					{passwordForm.busy ? m.settings.account.submitting : m.settings.account.submit}
				</Button>
			</div>
		</Form>
	</section>
	<section class="rule">
		<h2>{m.settings.account.deleteTitle}</h2>
		<p>{m.settings.account.deleteDescription}</p>
		<div class="actions">
			<Button onclick={() => (deleteOpen = true)} variant="danger">
				{m.settings.account.deleteOpen}
			</Button>
		</div>
	</section>
	<div class="legal">
		{#if acceptedLegalVersion}
			<span>{m.legal.accepted(legalVersionDate(acceptedLegalVersion))}</span>
			<span aria-hidden="true">·</span>
		{/if}
		<LegalLinks />
	</div>
</div>

<AccountDeleteDialog {email} ondeleted={accountGone} bind:open={deleteOpen} />

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

	.legal {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}
</style>
