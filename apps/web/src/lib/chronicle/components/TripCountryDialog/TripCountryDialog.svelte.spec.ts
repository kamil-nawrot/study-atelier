import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { TripCountryCheck } from '#lib/chronicle/trip-country-check/trip-country-check.svelte.ts';
import TripCountryDialog from './TripCountryDialog.svelte';

describe('TripCountryDialog', () => {
	it('names the places and countries and proceeds only on confirmation', async () => {
		const check = new TripCountryCheck();
		render(TripCountryDialog, { check });
		const answer = check.confirm({
			place: 'Giza',
			placeCountry: 'EG',
			trip: 'Ateny',
			tripCountry: 'GR'
		});

		await expect
			.element(
				page.getByText(
					m.chronicle.tripCountryDialog.description('Giza', 'Egipt', 'Ateny', 'Grecja')
				)
			)
			.toBeVisible();
		await userEvent.click(
			page.getByRole('button', { name: m.chronicle.tripCountryDialog.confirm })
		);

		expect(await answer).toBe(true);
	});

	it('goes back to the form', async () => {
		const check = new TripCountryCheck();
		render(TripCountryDialog, { check });
		const answer = check.confirm({
			place: 'Giza',
			placeCountry: 'EG',
			trip: 'Ateny',
			tripCountry: 'GR'
		});

		await userEvent.click(page.getByRole('button', { name: m.chronicle.tripCountryDialog.back }));

		expect(await answer).toBe(false);
	});
});
