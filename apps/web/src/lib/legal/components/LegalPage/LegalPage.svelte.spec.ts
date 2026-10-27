import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { afterNavigate, goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { LEGAL_VERSION, legalVersionDate } from '#lib/legal/version/version.ts';
import LegalPage from './LegalPage.svelte';

vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('$app/env/public', () => ({
	LEGAL_COMPANY: 'Firma Testowa',
	LEGAL_ADDRESS: 'ul. Długa 1, 00-001 Warszawa',
	LEGAL_NIP: '1234567890'
}));

beforeEach(() => {
	vi.clearAllMocks();
});

function arriveFrom(url: string | null): void {
	vi.mocked(afterNavigate).mockImplementation((callback) => {
		callback({ from: url ? { url: new URL(url) } : null } as never);
	});
}

describe('LegalPage', () => {
	it('goes to the start page when the learner came from another site', async () => {
		arriveFrom(null);
		const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
		render(LegalPage, { document: 'terms' });

		await page.getByRole('button', { name: m.common.back }).click();

		expect(back).not.toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/');
	});

	it('goes back within the app', async () => {
		arriveFrom('http://localhost/sign-up');
		const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
		render(LegalPage, { document: 'terms' });

		await page.getByRole('button', { name: m.common.back }).click();

		expect(back).toHaveBeenCalledOnce();
		expect(goto).not.toHaveBeenCalled();
	});

	it('shows the terms with the date they apply from', async () => {
		render(LegalPage, { document: 'terms' });

		await expect
			.element(page.getByRole('heading', { level: 1, name: m.legal.terms }))
			.toBeVisible();
		await expect
			.element(page.getByText(m.legal.version(legalVersionDate(LEGAL_VERSION))))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: '§ 7. Treści bezprawne i punkt kontaktowy' }))
			.toBeVisible();
	});

	it('shows the privacy policy', async () => {
		render(LegalPage, { document: 'privacy' });

		await expect
			.element(page.getByRole('heading', { level: 1, name: m.legal.privacy }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: '§ 2. Administrator danych' }))
			.toBeVisible();
	});
});
