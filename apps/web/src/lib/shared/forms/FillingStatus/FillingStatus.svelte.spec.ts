import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import FillingStatus from './FillingStatus.svelte';

describe('FillingStatus', () => {
	it('says what is being fetched and lets the learner stop it', async () => {
		const onstop = vi.fn();
		render(FillingStatus, { message: 'Wyszukiwanie w Wikipedii…', onstop });

		await expect.element(page.getByRole('status')).toHaveTextContent('Wyszukiwanie w Wikipedii…');
		await page.getByRole('button', { name: m.common.stopFetch }).click();

		expect(onstop).toHaveBeenCalledOnce();
	});

	it('offers no stop when closing the dialog already stops the search', async () => {
		render(FillingStatus, { message: 'Wyszukiwanie w Wikidata…' });

		await expect
			.element(page.getByRole('button', { name: m.common.stopFetch }))
			.not.toBeInTheDocument();
	});
});
