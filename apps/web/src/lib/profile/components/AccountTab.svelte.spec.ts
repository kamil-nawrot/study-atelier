import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { changePassword } from '#lib/auth/account.ts';
import { MIN_PASSWORD_LENGTH } from '#lib/auth/validation.ts';
import { m } from '#lib/i18n/index.ts';
import { TEST_EMAIL } from '#lib/testing/auth.ts';
import AccountTab from './AccountTab.svelte';

vi.mock('#lib/auth/account.ts', () => ({ changePassword: vi.fn() }));

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
