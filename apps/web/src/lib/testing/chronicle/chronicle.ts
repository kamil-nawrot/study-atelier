import type { Visit } from '#lib/chronicle/types/visit.ts';

export const VISIT_ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

export function testVisit(overrides: Partial<Visit> = {}): Visit {
	return {
		id: VISIT_ID,
		kind: 'visit',
		place: 'Musée d’Orsay',
		placeType: 'museum',
		countryCode: 'FR',
		date: { on: '2026-10-12', precision: 'day' },
		endsOn: null,
		tripId: null,
		notes: 'Lilie wodne w owalnej sali.',
		artworkIds: [],
		...overrides
	};
}

export const TRIP_ID = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d';

export function testTrip(overrides: Partial<Visit> = {}): Visit {
	return testVisit({
		id: TRIP_ID,
		kind: 'trip',
		place: 'Paris',
		placeType: 'city',
		date: { on: '2026-10-10', precision: 'day' },
		endsOn: '2026-10-14',
		notes: 'Five days on foot.',
		...overrides
	});
}
