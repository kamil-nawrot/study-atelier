import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { deleteAccount } from '#lib/auth/account-data/account-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { TEST_EMAIL } from '#lib/testing/auth/auth.ts';
import AccountDeleteDialog from './AccountDeleteDialog.svelte';

vi.mock('#lib/auth/account-data/account-data.ts', () => ({ deleteAccount: vi.fn() }));

const ondeleted = vi.fn();

function confirm(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.settings.account.deleteSubmit, exact: true });
}

function password(): ReturnType<typeof page.getByLabelText> {
	return page.getByLabelText(m.settings.account.deletePassword, { exact: true });
}

describe('AccountDeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes only after the password is typed', async () => {
		vi.mocked(deleteAccount).mockResolvedValue({ deleted: true });
		render(AccountDeleteDialog, { email: TEST_EMAIL, open: true, ondeleted });

		await expect.element(confirm()).toBeDisabled();
		await password().fill('vermeer1');
		await confirm().click();

		await vi.waitFor(() => expect(ondeleted).toHaveBeenCalled());
	});

	it('shows why the account could not be deleted and lets the learner try again', async () => {
		vi.mocked(deleteAccount).mockResolvedValue({
			deleted: false,
			error: m.settings.account.deleteFailed
		});
		render(AccountDeleteDialog, { email: TEST_EMAIL, open: true, ondeleted });

		await password().fill('vermeer1');
		await confirm().click();

		await expect.element(page.getByText(m.settings.account.deleteFailed)).toBeVisible();
		await expect.element(confirm()).toBeEnabled();
		expect(ondeleted).not.toHaveBeenCalled();
	});

	it('closes on "Anuluj" without deleting', async () => {
		render(AccountDeleteDialog, { email: TEST_EMAIL, open: true, ondeleted });

		await page.getByRole('button', { name: m.common.cancel }).click();

		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		expect(deleteAccount).not.toHaveBeenCalled();
	});
});
