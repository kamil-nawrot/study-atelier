import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { changePassword, requestEmailChange } from '#lib/auth/account-data/account-data.ts';
import { MIN_PASSWORD_LENGTH } from '#lib/auth/validation/validation.ts';
import { m } from '#lib/i18n/i18n.ts';
import { TEST_EMAIL } from '#lib/testing/auth/auth.ts';
import AccountTab from './AccountTab.svelte';

vi.mock('#lib/auth/account-data/account-data.ts', () => ({
	changePassword: vi.fn(),
	requestEmailChange: vi.fn()
}));

const onchanged = vi.fn();

function field(label: string): ReturnType<typeof page.getByLabelText> {
	return page.getByLabelText(label, { exact: true });
}

async function fillPasswords(current: string, next: string): Promise<void> {
	await field(m.settings.account.currentPassword).fill(current);
	await field(m.settings.account.newPassword).fill(next);
}

function submit(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.settings.account.submit });
}

describe('AccountTab email', () => {
	function emailSubmit(): ReturnType<typeof page.getByRole> {
		return page.getByRole('button', { name: m.settings.account.emailSubmit });
	}

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows the current address and checks the new one before it calls the server', async () => {
		render(AccountTab, { email: TEST_EMAIL, onchanged });
		await expect.element(page.getByText(m.settings.account.currentEmail(TEST_EMAIL))).toBeVisible();
		await emailSubmit().click();

		await expect.element(page.getByText(m.validation.emailRequired)).toBeVisible();
		expect(requestEmailChange).not.toHaveBeenCalled();
	});

	it('sends the links and says they went to both addresses', async () => {
		vi.mocked(requestEmailChange).mockResolvedValue({ sent: true });
		render(AccountTab, { email: TEST_EMAIL, onchanged });
		await field(m.settings.account.newEmail).fill('new@example.com');
		await emailSubmit().click();

		expect(requestEmailChange).toHaveBeenCalledWith(TEST_EMAIL, 'new@example.com');
		await expect.element(page.getByText(m.settings.account.emailSent)).toBeVisible();
	});

	it('shows a refused address under its field', async () => {
		vi.mocked(requestEmailChange).mockResolvedValue({
			sent: false,
			error: m.authErrors.emailTaken
		});
		render(AccountTab, { email: TEST_EMAIL, onchanged });
		await field(m.settings.account.newEmail).fill('taken@example.com');
		await emailSubmit().click();

		await expect.element(page.getByText(m.authErrors.emailTaken)).toBeVisible();
		await expect.element(page.getByText(m.settings.account.emailSent)).not.toBeInTheDocument();
	});

	it('reminds that a change waits for the links', async () => {
		render(AccountTab, { email: TEST_EMAIL, pendingEmail: 'new@example.com', onchanged });

		await expect
			.element(page.getByText(m.settings.account.emailPending('new@example.com')))
			.toBeVisible();
	});
});

describe('AccountTab', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		render(AccountTab, { email: TEST_EMAIL, onchanged });
	});

	it('signs out the other devices by default', async () => {
		await expect
			.element(page.getByRole('checkbox', { name: m.settings.account.signOutOthers }))
			.toBeChecked();
	});

	it('asks for both passwords before it calls the server', async () => {
		await submit().click();

		await expect.element(page.getByText(m.validation.passwordRequired).first()).toBeVisible();
		expect(changePassword).not.toHaveBeenCalled();
	});

	it('says how long the new password has to be', async () => {
		await fillPasswords('vermeer1', 'short');
		await submit().click();

		await expect
			.element(page.getByText(m.validation.passwordTooShort(MIN_PASSWORD_LENGTH, 5)))
			.toBeVisible();
		expect(changePassword).not.toHaveBeenCalled();
	});

	it('changes the password, confirms it and empties the fields', async () => {
		vi.mocked(changePassword).mockResolvedValue({ changed: true });
		await fillPasswords('vermeer1', 'rembrandt2');
		await page.getByText(m.settings.account.signOutOthers).click();
		await submit().click();

		expect(changePassword).toHaveBeenCalledWith(TEST_EMAIL, 'vermeer1', 'rembrandt2', false);
		expect(onchanged).toHaveBeenCalledWith(m.settings.account.changed);
		await expect.element(field(m.settings.account.currentPassword)).toHaveValue('');
		await expect.element(field(m.settings.account.newPassword)).toHaveValue('');
	});

	it('shows a wrong current password under its field and confirms nothing', async () => {
		vi.mocked(changePassword).mockResolvedValue({
			changed: false,
			currentError: m.settings.account.wrongCurrent
		});
		await fillPasswords('wrong-one', 'rembrandt2');
		await submit().click();

		await expect.element(page.getByText(m.settings.account.wrongCurrent)).toBeVisible();
		expect(onchanged).not.toHaveBeenCalled();
		await expect.element(field(m.settings.account.newPassword)).toHaveValue('rembrandt2');
	});

	it('shows a general failure in an alert at the top', async () => {
		vi.mocked(changePassword).mockResolvedValue({ changed: false, error: m.authErrors.network });
		await fillPasswords('vermeer1', 'rembrandt2');
		await submit().click();

		await expect
			.element(page.getByRole('alert').filter({ hasText: m.settings.account.errorTitle }))
			.toHaveTextContent(m.authErrors.network);
	});

	it('warns, instead of confirming, when the other devices stay signed in', async () => {
		vi.mocked(changePassword).mockResolvedValue({
			changed: true,
			othersError: m.settings.account.othersFailed
		});
		await fillPasswords('vermeer1', 'rembrandt2');
		await submit().click();

		await expect
			.element(page.getByRole('status').filter({ hasText: m.settings.account.othersFailedTitle }))
			.toHaveTextContent(m.settings.account.othersFailed);
		expect(onchanged).not.toHaveBeenCalled();
		await expect.element(field(m.settings.account.newPassword)).toHaveValue('');
	});
});
