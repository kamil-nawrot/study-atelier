import type { Visit } from '#lib/chronicle/types/visit.ts';

export const VISIT_ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

export function testVisit(overrides: Partial<Visit> = {}): Visit {
	return {
		id: VISIT_ID,
		place: 'Musée d’Orsay',
		placeType: 'museum',
		countryCode: 'FR',
		date: { on: '2026-10-12', precision: 'day' },
		notes: 'Lilie wodne w owalnej sali.',
		artworkIds: [],
		...overrides
	};
}
