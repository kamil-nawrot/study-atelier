import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	draftOfVisitForm,
	emptyVisitForm,
	placeArtworks,
	searchArtworks,
	suggestedArtworks,
	toggled,
	validateVisitForm,
	visitFormChanged,
	visitFormOf,
	withExtra,
	withPlaceArtworks
} from './visit-form.ts';
import { testTrip, testVisit } from '#lib/testing/chronicle/chronicle.ts';
import type { TripPlace } from '#lib/chronicle/types/trip-place.ts';
import type { Town } from '#lib/map/types/town.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

const lilies = testArtwork(1, 'Water Lilies', { location: 'Musée d’Orsay' });
const dance = testArtwork(2, 'The Dance Class', { location: 'musée d’orsay ' });
const monaLisa = testArtwork(3, 'Mona Lisa', { location: 'Luwr', authors: ['Leonardo da Vinci'] });
const kiss = testArtwork(4, 'The Kiss', { location: 'Belvedere', authors: ['Gustav Klimt'] });
const artworks = [lilies, dance, monaLisa, kiss];

function form(overrides: Partial<VisitFormState> = {}): VisitFormState {
	return { ...emptyVisitForm(), ...overrides };
}

function atPlace(state: VisitFormState) {
	return placeArtworks(artworks, state.place[0] ?? '');
}

const visit = testVisit({
	id: 'visit',
	place: 'Musée d’Orsay',
	notes: 'Lilie.',
	artworkIds: ['artwork-1', 'artwork-4', 'artwork-9']
});

const portal = testArtwork(5, 'Portal of the Virgin', { location: 'Notre-Dame' });
const street = testArtwork(6, 'Street lamp', { location: 'Paris' });
const tripPlaces: TripPlace[] = [
	{ name: 'Paris', placeType: 'city', point: { latitude: 48.857, longitude: 2.352 } },
	{ name: 'Notre-Dame', placeType: 'on_site', point: { latitude: 48.853, longitude: 2.35 } },
	{ name: 'Musée d’Orsay', placeType: 'museum', point: { latitude: 48.86, longitude: 2.326 } },
	{ name: 'Chartres Cathedral', placeType: 'on_site', point: { latitude: 48.447, longitude: 1.488 } }
];
const towns: Town[] = [
	{ name: 'Paris', countryCode: 'FR', latitude: 48.857, longitude: 2.352 },
	{ name: 'Chartres', countryCode: 'FR', latitude: 48.447, longitude: 1.489 }
];
const source = { artworks: [...artworks, portal, street], tripPlaces, towns };

describe('suggestedArtworks', () => {
	it('suggests the artworks of the place of a visit', () => {
		expect(suggestedArtworks(form({ place: ['Musée d’Orsay'] }), source)).toEqual([lilies, dance]);
	});

	it('suggests the artworks of the city of a trip and of its sites, not of its museums', () => {
		expect(suggestedArtworks(form({ kind: 'trip', place: ['paris'] }), source)).toEqual([
			portal,
			street
		]);
	});
});

describe('placeArtworks', () => {
	it('finds the artworks of a place whatever the letter case and spaces', () => {
		expect(placeArtworks(artworks, 'Musée d’Orsay')).toEqual([lilies, dance]);
	});

	it('finds nothing without a place', () => {
		expect(placeArtworks(artworks, ' ')).toEqual([]);
	});
});

describe('withPlaceArtworks', () => {
	it('ticks every artwork of a newly chosen place', () => {
		const next = withPlaceArtworks(form({ place: ['Musée d’Orsay'] }), atPlace(form({ place: ['Musée d’Orsay'] })));

		expect(next.chosen).toEqual(['artwork-1', 'artwork-2']);
	});

	it('replaces the ticks of the old place and keeps the added artworks', () => {
		const before = form({
			place: ['Luwr'],
			chosen: ['artwork-1', 'artwork-4'],
			extra: ['artwork-4', 'artwork-2']
		});

		const next = withPlaceArtworks(before, atPlace(before));

		expect(next.chosen).toEqual(['artwork-3', 'artwork-4']);
		expect(next.extra).toEqual(['artwork-4', 'artwork-2']);
	});

	it('brings back the saved ticks when the saved place is chosen again', () => {
		const saved = form({ place: ['Musée d’Orsay'], chosen: ['artwork-2', 'artwork-4'] });
		const before = form({ place: ['musée d’orsay'], chosen: ['artwork-3'], extra: ['artwork-4'] });

		const next = withPlaceArtworks(before, atPlace(before), saved);

		expect(next.chosen).toEqual(['artwork-2']);
	});

	it('moves an added artwork of the new place into its group', () => {
		const before = form({ place: ['Luwr'], chosen: ['artwork-3'], extra: ['artwork-3'] });
		const next = withPlaceArtworks(before, atPlace(before));

		expect(next.chosen).toEqual(['artwork-3']);
		expect(next.extra).toEqual([]);
	});
});

describe('visitFormOf', () => {
	it('shows the saved ticks and the artworks added from other places', () => {
		const state = visitFormOf(visit, artworks, placeArtworks(artworks, visit.place));

		expect(state).toEqual({
			kind: 'visit',
			place: ['Musée d’Orsay'],
			placeQuery: '',
			day: '12',
			month: '10',
			year: '2026',
			endDay: '',
			endMonth: '',
			endYear: '',
			notes: 'Lilie.',
			chosen: ['artwork-1', 'artwork-4'],
			extra: ['artwork-4']
		});
	});

	it('shows the end of a trip', () => {
		const state = visitFormOf(testTrip(), artworks, []);

		expect(state).toMatchObject({ kind: 'trip', day: '10', endDay: '14', endMonth: '10', endYear: '2026' });
	});
});

describe('toggled and withExtra', () => {
	it('unticks an artwork and keeps it in the grid', () => {
		const state = toggled(form({ chosen: ['artwork-1', 'artwork-2'] }), 'artwork-1');

		expect(state.chosen).toEqual(['artwork-2']);
		expect(toggled(state, 'artwork-1').chosen).toEqual(['artwork-2', 'artwork-1']);
	});

	it('adds and ticks an artwork from the search once', () => {
		const state = withExtra(withExtra(form(), 'artwork-4'), 'artwork-4');

		expect(state.extra).toEqual(['artwork-4']);
		expect(state.chosen).toEqual(['artwork-4']);
	});
});

describe('searchArtworks', () => {
	it('finds artworks by title or author and leaves out those in the grid', () => {
		expect(searchArtworks(artworks, 'klimt', new Set())).toEqual([kiss]);
		expect(searchArtworks(artworks, 'the', new Set(['artwork-2']))).toEqual([kiss]);
	});

	it('finds nothing for an empty query', () => {
		expect(searchArtworks(artworks, '  ', new Set())).toEqual([]);
	});
});

describe('validateVisitForm', () => {
	it('asks for a place and at least a year', () => {
		expect(validateVisitForm(form())).toEqual({
			place: m.chronicle.form.placeRequired,
			year: m.chronicle.form.yearRequired
		});
	});

	it('names the field of a date it cannot read', () => {
		const place = ['Luwr'];
		expect(validateVisitForm(form({ place, year: '26' }))).toEqual({
			year: m.chronicle.form.yearInvalid
		});
		expect(validateVisitForm(form({ place, day: '12', year: '2026' }))).toEqual({
			month: m.chronicle.form.monthRequired
		});
		expect(validateVisitForm(form({ place, day: '31', month: '2', year: '2026' }))).toEqual({
			day: m.chronicle.form.dayInvalid
		});
	});

	it('accepts a place and a month', () => {
		expect(validateVisitForm(form({ place: ['Luwr'], month: '10', year: '2026' }))).toEqual({});
	});

	it('asks a trip for a city and refuses a place of another type', () => {
		const trip = { kind: 'trip' as const, year: '2026' };
		expect(validateVisitForm(form(trip), tripPlaces).place).toBe(m.chronicle.trip.form.placeRequired);
		expect(validateVisitForm(form({ ...trip, place: ['Notre-Dame'] }), tripPlaces).place).toBe(
			m.chronicle.trip.form.notCity
		);
		expect(validateVisitForm(form({ ...trip, place: ['Kraków'] }), tripPlaces)).toEqual({});
	});

	it('checks the end of a trip', () => {
		const trip = form({ kind: 'trip', place: ['Paris'], day: '10', month: '10', year: '2026' });
		expect(validateVisitForm({ ...trip, endDay: '9' }).endDay).toBe(
			m.chronicle.trip.form.endBeforeStart
		);
		expect(validateVisitForm({ ...trip, endMonth: '11' }).endDay).toBe(
			m.chronicle.trip.form.endApproximate
		);
		expect(validateVisitForm({ ...trip, day: '', endDay: '14' }).endDay).toBe(
			m.chronicle.trip.form.endApproximate
		);
		expect(validateVisitForm({ ...trip, endDay: '31', endMonth: '11' }).endDay).toBe(
			m.chronicle.form.dayInvalid
		);
		expect(validateVisitForm({ ...trip, endDay: '3', endYear: '27' }).endYear).toBe(
			m.chronicle.form.yearInvalid
		);
		expect(validateVisitForm({ ...trip, endDay: '14' })).toEqual({});
	});
});

describe('draftOfVisitForm', () => {
	it('keeps the artworks the form does not show', () => {
		const draft = draftOfVisitForm(
			form({ place: [' Luwr '], year: '2026', chosen: ['artwork-3'] }),
			['artwork-9', 'artwork-3']
		);

		expect(draft).toEqual({
			kind: 'visit',
			place: 'Luwr',
			date: { on: '2026-01-01', precision: 'year' },
			endsOn: null,
			notes: '',
			artworkIds: ['artwork-3', 'artwork-9']
		});
	});

	it('gives a trip its end, taking the missing month and year from the start', () => {
		const trip = form({ kind: 'trip', place: ['Paris'], day: '28', month: '10', year: '2026' });

		expect(draftOfVisitForm({ ...trip, endDay: '3', endMonth: '11' }).endsOn).toBe('2026-11-03');
		expect(draftOfVisitForm({ ...trip, endDay: '30' }).endsOn).toBe('2026-10-30');
		expect(draftOfVisitForm({ ...trip, endDay: '28' }).endsOn).toBeNull();
		expect(draftOfVisitForm(trip).endsOn).toBeNull();
	});
});

describe('visitFormChanged', () => {
	it('ignores the order of ticks and spaces around the date', () => {
		const saved = form({ place: ['Luwr'], year: '2026', chosen: ['a', 'b'] });

		expect(visitFormChanged({ ...saved, year: ' 2026 ', chosen: ['b', 'a'] }, saved)).toBe(false);
		expect(visitFormChanged({ ...saved, chosen: ['a'] }, saved)).toBe(true);
		expect(visitFormChanged({ ...saved, notes: 'x' }, saved)).toBe(true);
		expect(visitFormChanged({ ...saved, month: '3' }, saved)).toBe(true);
		expect(visitFormChanged({ ...saved, kind: 'trip' }, saved)).toBe(true);
		expect(visitFormChanged({ ...saved, endDay: ' ' }, saved)).toBe(false);
		expect(visitFormChanged({ ...saved, endDay: '4' }, saved)).toBe(true);
	});
});
