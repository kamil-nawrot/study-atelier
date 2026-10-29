import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { acceptedNow } from '#lib/legal/accepted/accepted.svelte.ts';
import { acceptLegal } from '#lib/legal/legal-data/legal-data.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import LegalUpdateDialog from './LegalUpdateDialog.svelte';

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier'),
	data: { session: { user: { id: 'learner-a' } } }
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/state', () => ({ page: pageState }));
vi.mock('#lib/legal/legal-data/legal-data.ts', () => ({ acceptLegal: vi.fn() }));

function dialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.legal.updateTitle });
}

beforeEach(() => {
	vi.clearAllMocks();
	pageState.url = new URL('http://localhost/atelier');
	acceptedNow.version = null;
	acceptedNow.learner = null;
	pageState.data = { session: { user: { id: 'learner-a' } } };
});

describe('LegalUpdateDialog', () => {
	it('asks a learner who accepted an older version to accept the new one', async () => {
		vi.mocked(acceptLegal).mockResolvedValue(undefined);
		render(LegalUpdateDialog, { accepted: Promise.resolve('2020-01-01') });

		await expect.element(dialog()).toBeVisible();
		await page.getByRole('button', { name: m.legal.updateAccept }).click();

		await expect.element(dialog()).not.toBeInTheDocument();
		expect(acceptedNow.version).toBe(LEGAL_VERSION);
	});

	it('does not ask again on the next page after the acceptance', async () => {
		acceptedNow.version = LEGAL_VERSION;
		acceptedNow.learner = 'learner-a';
		const stale = Promise.resolve('2020-01-01');
		render(LegalUpdateDialog, { accepted: stale });

		await stale;
		await tick();
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('still asks another learner who signs in in the same tab', async () => {
		acceptedNow.version = LEGAL_VERSION;
		acceptedNow.learner = 'learner-a';
		pageState.data = { session: { user: { id: 'learner-b' } } };
		render(LegalUpdateDialog, { accepted: Promise.resolve('2020-01-01') });

		await expect.element(dialog()).toBeInTheDocument();
	});

	it('stays quiet for the current version, an unknown answer and the settings', async () => {
		const answers = [Promise.resolve(LEGAL_VERSION), Promise.resolve(undefined)];
		for (const accepted of answers) render(LegalUpdateDialog, { accepted });
		pageState.url = new URL('http://localhost/atelier/settings?tab=data');
		const onSettings = Promise.resolve(null);
		render(LegalUpdateDialog, { accepted: onSettings });

		await Promise.all([...answers, onSettings]);
		await tick();
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('keeps the dialog open with the reason when the acceptance is not saved', async () => {
		vi.mocked(acceptLegal).mockResolvedValue(m.legal.acceptFailed);
		render(LegalUpdateDialog, { accepted: Promise.resolve(null) });

		await page.getByRole('button', { name: m.legal.updateAccept }).click();

		await expect.element(page.getByText(m.legal.acceptFailed)).toBeVisible();
		await expect.element(dialog()).toBeVisible();
	});

	it('leads to the settings to export the atelier or delete the account', async () => {
		render(LegalUpdateDialog, { accepted: Promise.resolve(null) });

		await page.getByRole('button', { name: m.legal.updateSettings }).click();

		expect(goto).toHaveBeenCalledWith('/atelier/settings?tab=account');
	});
});
