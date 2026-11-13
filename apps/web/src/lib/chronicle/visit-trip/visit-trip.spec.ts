import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { emptyVisitForm } from '#lib/chronicle/visit-form/visit-form.ts';
import { testTrip } from '#lib/testing/chronicle/chronicle.ts';
import { linkedTrip, sameCityTrip, tripOptions, tripsCovering } from './visit-trip.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';
import type { Town } from '#lib/map/types/town.ts';

const paris = testTrip({ id: 'paris' });
const vienna = testTrip({
	id: 'vienna',
	place: 'Vienna',
	date: { on: '2026-10-13', precision: 'day' },
	endsOn: '2026-10-15'
});
const lyon = testTrip({
	id: 'lyon',
	place: 'Lyon',
	date: { on: '2026-09-01', precision: 'month' },
	endsOn: null
});
const trips = [paris, vienna, lyon];

const tripPlaces: TripPlace[] = [
	{ name: 'Paris', placeType: 'city', point: { latitude: 48.857, longitude: 2.352 } },
	{ name: 'Vienna', placeType: 'city', point: { latitude: 48.208, longitude: 16.373 } },
	{ name: 'Louvre', placeType: 'museum', point: { latitude: 48.861, longitude: 2.336 } },
	{ name: 'Belvedere', placeType: 'museum', point: { latitude: 48.191, longitude: 16.381 } }
];
const towns: Town[] = [
	{ name: 'Paris', countryCode: 'FR', latitude: 48.857, longitude: 2.352 },
	{ name: 'Vienna', countryCode: 'AT', latitude: 48.208, longitude: 16.373 }
];

function form(overrides: Partial<VisitFormState> = {}): VisitFormState {
	return { ...emptyVisitForm(), day: '13', month: '10', year: '2026', ...overrides };
}

describe('tripsCovering', () => {
	it('finds the trips whose days hold the date of a visit', () => {
		expect(tripsCovering(trips, { on: '2026-10-14', precision: 'day' })).toEqual([paris, vienna]);
		expect(tripsCovering(trips, { on: '2026-10-16', precision: 'day' })).toEqual([]);
	});

	it('takes a whole month or year of a visit or a trip without days', () => {
		expect(tripsCovering(trips, { on: '2026-10-01', precision: 'month' })).toEqual([paris, vienna]);
		expect(tripsCovering(trips, { on: '2026-09-20', precision: 'day' })).toEqual([lyon]);
		expect(tripsCovering(trips, { on: '2026-01-01', precision: 'year' })).toEqual(trips);
	});
});

describe('sameCityTrip', () => {
	it('finds the trip to the city of the place of a visit', () => {
		expect(sameCityTrip(trips, 'Belvedere', tripPlaces, towns)).toBe(vienna);
		expect(sameCityTrip(trips, 'louvre', tripPlaces, towns)).toBe(paris);
	});

	it('finds the trip by the name of its city and nothing for a place without a point', () => {
		expect(sameCityTrip(trips, 'paris', [], [])).toBe(paris);
		expect(sameCityTrip(trips, 'Kraków', tripPlaces, towns)).toBeUndefined();
		expect(sameCityTrip(trips, ' ', tripPlaces, towns)).toBeUndefined();
	});
});

describe('linkedTrip', () => {
	const source = { tripPlaces, towns };

	it('picks the trip of the same city until the learner chooses', () => {
		expect(linkedTrip(form({ place: ['Belvedere'] }), trips, source, false)).toEqual({
			trips: [paris, vienna],
			tripId: 'vienna'
		});
		expect(linkedTrip(form({ place: ['Kraków'] }), trips, source, false).tripId).toBe('');
	});

	it('keeps the chosen trip while it covers the date and drops it after', () => {
		const chosen = form({ place: ['Belvedere'], tripId: 'paris' });
		expect(linkedTrip(chosen, trips, source, true).tripId).toBe('paris');
		expect(linkedTrip({ ...chosen, day: '20' }, trips, source, true)).toEqual({
			trips: [],
			tripId: ''
		});
	});

	it('offers no trip to a trip or a form without a date', () => {
		expect(linkedTrip(form({ kind: 'trip' }), trips, source, false).trips).toEqual([]);
		expect(linkedTrip(form({ year: '' }), trips, source, false).trips).toEqual([]);
	});
});

describe('tripOptions', () => {
	it('names each trip by its city and dates after the choice without a trip', () => {
		expect(tripOptions([vienna]).map((option) => option.label)).toEqual([
			m.chronicle.form.noTrip,
			expect.stringMatching(/^Vienna, 13–15 października/)
		]);
	});
});
