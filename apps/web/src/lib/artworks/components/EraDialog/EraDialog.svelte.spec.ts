import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { EraCheck } from '#lib/artworks/era-check/era-check.svelte.ts';
import EraDialog from './EraDialog.svelte';

function dialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.eraDialog.title });
}

describe('EraDialog', () => {
	it('names the year and the era and answers the check', async () => {
		const check = new EraCheck();
		render(EraDialog, {
			check,
			eraCode: 'middle_ages',
			yearFrom: null,
			yearTo: 1650,
			approximate: true
		});
		const answer = check.confirm();

		await expect
			.element(dialog())
			.toHaveAccessibleDescription(
				'Rok powstania ok. 1650 nie mieści się w epoce „średniowiecze” (476–1492). Jeśli tak ma być, po prostu zapisz dzieło.'
			);
		await page.getByRole('button', { name: m.eraDialog.confirm }).click();

		await expect(answer).resolves.toBe(true);
		await expect.element(dialog()).not.toBeInTheDocument();
	});

	it('speaks of years for a range and goes back on request', async () => {
		const check = new EraCheck();
		render(EraDialog, {
			check,
			eraCode: 'middle_ages',
			yearFrom: 1650,
			yearTo: 1700,
			approximate: false
		});
		const answer = check.confirm();

		await expect
			.element(dialog())
			.toHaveAccessibleDescription(
				'Lata powstania 1650–1700 nie mieszczą się w epoce „średniowiecze” (476–1492). Jeśli tak ma być, po prostu zapisz dzieło.'
			);
		await page.getByRole('button', { name: m.eraDialog.back }).click();

		await expect(answer).resolves.toBe(false);
	});
});
