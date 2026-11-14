import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { emptyVisitForm } from '#lib/chronicle/visit-form/visit-form.ts';
import { testTrip } from '#lib/testing/chronicle/chronicle.ts';
import { linkedTrip, sameCityTrip, tripOptions, tripsCovering } from './visit-trip.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

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
	{ id: 'paris', name: 'Paris', placeType: 'city', countryCode: 'FR', point: null, cityId: null },
	{ id: 'vienna', name: 'Vienna', placeType: 'city', countryCode: 'AT', point: null, cityId: null },
	{
		id: 'louvre',
		name: 'Louvre',
		placeType: 'museum',
		countryCode: 'FR',
		point: null,
		cityId: 'paris'
	},
	{
		id: 'belvedere',
		name: 'Belvedere',
		placeType: 'museum',
		countryCode: 'AT',
		point: null,
		cityId: 'vienna'
	}
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
		expect(sameCityTrip(trips, 'Belvedere', tripPlaces)).toBe(vienna);
		expect(sameCityTrip(trips, 'louvre', tripPlaces)).toBe(paris);
	});

	it('finds the trip by the name of its city and nothing for a place without a city', () => {
		expect(sameCityTrip(trips, 'paris', [])).toBe(paris);
		expect(sameCityTrip(trips, 'Kraków', tripPlaces)).toBeUndefined();
		expect(sameCityTrip(trips, ' ', tripPlaces)).toBeUndefined();
	});
});

describe('linkedTrip', () => {
	const source = { tripPlaces };

	it('picks the trip of the same city until the learner chooses', () => {
		expect(linkedTrip(form({ place: ['Belvedere'] }), trips, source, false)).toEqual({
			trips: [paris, vienna],
			tripId: 'vienna',
			outside: false
		});
		expect(linkedTrip(form({ place: ['Kraków'] }), trips, source, false).tripId).toBe('');
	});

	it('keeps the chosen trip and marks it when the date falls outside it', () => {
		const chosen = form({ place: ['Belvedere'], tripId: 'paris' });
		expect(linkedTrip(chosen, trips, source, true)).toMatchObject({
			tripId: 'paris',
			outside: false
		});
		expect(linkedTrip({ ...chosen, day: '20' }, trips, source, true)).toEqual({
			trips: [paris],
			tripId: 'paris',
			outside: true
		});
	});

	it('leaves the visit outside a trip that no longer exists', () => {
		const chosen = form({ day: '20', tripId: 'gone' });
		expect(linkedTrip(chosen, trips, source, true)).toEqual({
			trips: [],
			tripId: '',
			outside: false
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
