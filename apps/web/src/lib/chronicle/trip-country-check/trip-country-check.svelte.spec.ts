import { describe, expect, it } from 'vitest';
import { TripCountryCheck } from './trip-country-check.svelte.ts';

const clash = { place: 'Giza', placeCountry: 'EG', trip: 'Ateny', tripCountry: 'GR' };

describe('TripCountryCheck', () => {
	it('lets a visit without a clash through without asking', async () => {
		const check = new TripCountryCheck();

		expect(await check.confirm(undefined)).toBe(true);
		expect(check.open).toBe(false);
	});

	it('asks about a clash and gives the answer', async () => {
		const check = new TripCountryCheck();
		const answer = check.confirm(clash);

		expect(check.open).toBe(true);
		expect(check.clash).toEqual(clash);
		check.answer(true);

		expect(await answer).toBe(true);
		expect(check.open).toBe(false);
	});

	it('keeps the visit out of the trip when the learner goes back', async () => {
		const check = new TripCountryCheck();
		const answer = check.confirm(clash);
		check.answer(false);

		expect(await answer).toBe(false);
	});
});
