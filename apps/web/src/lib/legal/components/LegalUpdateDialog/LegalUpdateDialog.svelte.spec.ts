import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { goto, invalidate } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { acceptLegal, LEGAL_DEPENDENCY } from '#lib/legal/legal-data/legal-data.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import LegalUpdateDialog from './LegalUpdateDialog.svelte';

const pageState = vi.hoisted(() => ({ url: new URL('http://localhost/atelier') }));

vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidate: vi.fn() }));
vi.mock('$app/state', () => ({ page: pageState }));
vi.mock('#lib/legal/legal-data/legal-data.ts', () => ({
	acceptLegal: vi.fn(),
	LEGAL_DEPENDENCY: 'legal:accepted'
}));

function dialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.legal.updateTitle });
}

beforeEach(() => {
	vi.clearAllMocks();
	pageState.url = new URL('http://localhost/atelier');
});

describe('LegalUpdateDialog', () => {
	it('asks a learner who accepted an older version to accept the new one', async () => {
		vi.mocked(acceptLegal).mockResolvedValue(undefined);
		render(LegalUpdateDialog, { accepted: Promise.resolve('2020-01-01') });

		await expect.element(dialog()).toBeVisible();
		await page.getByRole('button', { name: m.legal.updateAccept }).click();

		await expect.element(dialog()).not.toBeInTheDocument();
		expect(invalidate).toHaveBeenCalledWith(LEGAL_DEPENDENCY);
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
