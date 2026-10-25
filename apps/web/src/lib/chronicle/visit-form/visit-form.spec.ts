import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import {
	draftOfVisitForm,
	emptyVisitForm,
	placeArtworks,
	searchArtworks,
	toggled,
	validateVisitForm,
	visitFormChanged,
	visitFormOf,
	withExtra,
	withPlaceArtworks
} from './visit-form.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { VisitFormState } from '#lib/chronicle/types/visit-form-state.ts';

const lilies = testArtwork(1, 'Water Lilies', { location: 'Musée d’Orsay' });
const dance = testArtwork(2, 'The Dance Class', { location: 'musée d’orsay ' });
const monaLisa = testArtwork(3, 'Mona Lisa', { location: 'Luwr', authors: ['Leonardo da Vinci'] });
const kiss = testArtwork(4, 'The Kiss', { location: 'Belvedere', authors: ['Gustav Klimt'] });
const artworks = [lilies, dance, monaLisa, kiss];

function form(overrides: Partial<VisitFormState> = {}): VisitFormState {
	return { ...emptyVisitForm(), ...overrides };
}

const visit: Visit = {
	id: 'visit',
	place: 'Musée d’Orsay',
	placeType: 'museum',
	countryCode: 'FR',
	date: { on: '2026-10-12', precision: 'day' },
	notes: 'Lilie.',
	artworkIds: ['artwork-1', 'artwork-4', 'artwork-9']
};

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
		const next = withPlaceArtworks(form({ place: ['Musée d’Orsay'] }), artworks);

		expect(next.chosen).toEqual(['artwork-1', 'artwork-2']);
	});

	it('replaces the ticks of the old place and keeps the added artworks', () => {
		const before = form({
			place: ['Luwr'],
			chosen: ['artwork-1', 'artwork-4'],
			extra: ['artwork-4', 'artwork-2']
		});

		const next = withPlaceArtworks(before, artworks);

		expect(next.chosen).toEqual(['artwork-3', 'artwork-4']);
		expect(next.extra).toEqual(['artwork-4', 'artwork-2']);
	});

	it('moves an added artwork of the new place into its group', () => {
		const next = withPlaceArtworks(
			form({ place: ['Luwr'], chosen: ['artwork-3'], extra: ['artwork-3'] }),
			artworks
		);

		expect(next.chosen).toEqual(['artwork-3']);
		expect(next.extra).toEqual([]);
	});
});

describe('visitFormOf', () => {
	it('shows the saved ticks and the artworks added from other places', () => {
		const state = visitFormOf(visit, artworks);

		expect(state).toEqual({
			place: ['Musée d’Orsay'],
			placeQuery: '',
			dateText: '12.10.2026',
			notes: 'Lilie.',
			chosen: ['artwork-1', 'artwork-4'],
			extra: ['artwork-4']
		});
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
	it('asks for a place and a date', () => {
		expect(validateVisitForm(form())).toEqual({
			place: m.chronicle.form.placeRequired,
			date: m.chronicle.form.dateRequired
		});
	});

	it('rejects a date it cannot read', () => {
		expect(validateVisitForm(form({ place: ['Luwr'], dateText: '2026-10-12' }))).toEqual({
			date: m.chronicle.form.dateInvalid
		});
	});

	it('accepts a place and a month', () => {
		expect(validateVisitForm(form({ place: ['Luwr'], dateText: '10.2026' }))).toEqual({});
	});
});

describe('draftOfVisitForm', () => {
	it('keeps the artworks the form does not show', () => {
		const draft = draftOfVisitForm(
			form({ place: [' Luwr '], dateText: '2026', chosen: ['artwork-3'] }),
			['artwork-9', 'artwork-3']
		);

		expect(draft).toEqual({
			place: 'Luwr',
			date: { on: '2026-01-01', precision: 'year' },
			notes: '',
			artworkIds: ['artwork-3', 'artwork-9']
		});
	});
});

describe('visitFormChanged', () => {
	it('ignores the order of ticks and spaces around the date', () => {
		const saved = form({ place: ['Luwr'], dateText: '2026', chosen: ['a', 'b'] });

		expect(visitFormChanged({ ...saved, dateText: ' 2026 ', chosen: ['b', 'a'] }, saved)).toBe(
			false
		);
		expect(visitFormChanged({ ...saved, chosen: ['a'] }, saved)).toBe(true);
		expect(visitFormChanged({ ...saved, notes: 'x' }, saved)).toBe(true);
	});
});
