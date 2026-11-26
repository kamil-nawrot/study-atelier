import { describe, expect, it } from 'vitest';
import { albumEvent, albumTerm, albumValue } from '#lib/testing/albums/albums.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { eventPrefill, termDraft, valueDrafts } from './album-item-drafts.ts';

const TODAY = '2026-11-26';

describe('termDraft', () => {
	it('starts a new term from the album text with its source', () => {
		const draft = termDraft(
			albumTerm('Carving', { name: 'Carving', alternativeNames: ['Cutting'] }),
			undefined,
			TODAY
		);

		expect(draft).toMatchObject({
			name: 'Carving',
			category: 'technique',
			definition: 'Carving definition.',
			synonyms: ['Cutting'],
			source: { licence: 'CC BY-SA 4.0', fetchedOn: TODAY }
		});
	});

	it('starts a new figure with its life years and country', () => {
		const draft = termDraft(
			albumTerm('f', {
				kind: 'figure',
				category: 'artist',
				birthYear: -500,
				deathYear: -430,
				country: 'Grecja'
			}),
			undefined,
			TODAY
		);

		expect(draft.figure).toMatchObject({ birthYear: '500', deathYear: '430', country: 'Grecja' });
	});

	it('fills only what the learner left empty', () => {
		const existing = testEntry('a-1', 'Carving', { definition: '', synonyms: ['Own'] });
		const draft = termDraft(
			albumTerm('c', { name: 'Carving', alternativeNames: ['Other'] }),
			existing,
			TODAY
		);

		expect(draft.definition).toBe('c definition.');
		expect(draft.synonyms).toEqual(['Own']);
		expect(draft.source?.fetchedOn).toBe(TODAY);
	});

	it('keeps an own definition, its source and the figure data', () => {
		const existing = {
			...testEntry('a-2', 'Artist', { category: 'artist', definition: 'Own.' }),
			figure: {
				image: null,
				birthYear: 1400,
				deathYear: 1450,
				yearsApproximate: true,
				country: 'Own'
			}
		};
		const draft = termDraft(
			albumTerm('f', {
				kind: 'figure',
				category: 'artist',
				birthYear: 1300,
				deathYear: 1350,
				country: 'Other'
			}),
			existing,
			TODAY
		);

		expect(draft.definition).toBe('Own.');
		expect(draft.source).toBeNull();
		expect(draft.figure).toMatchObject({ birthYear: '1400', deathYear: '1450', country: 'Own' });
	});
});

describe('eventPrefill', () => {
	it('starts a new event from the album', () => {
		const event = eventPrefill(
			albumEvent('e', { source: { title: 'E', url: 'https://x.test', licence: 'CC' } }),
			undefined,
			TODAY
		);

		expect(event).toMatchObject({
			id: '',
			name: 'e',
			yearTo: -25000,
			description: 'e description.',
			source: { fetchedOn: TODAY }
		});
	});

	it('fills an empty description of an own event and keeps a written one', () => {
		const own = {
			id: 'ev',
			name: 'e',
			yearFrom: null,
			yearTo: 1900,
			yearApproximate: false,
			description: '',
			source: null
		};

		expect(eventPrefill(albumEvent('e'), own, TODAY)).toMatchObject({
			id: 'ev',
			yearTo: 1900,
			description: 'e description.'
		});
		expect(eventPrefill(albumEvent('e'), { ...own, description: 'Mine.' }, TODAY).description).toBe(
			'Mine.'
		);
	});
});

describe('valueDrafts', () => {
	it('starts a new author with the album data', () => {
		const drafts = valueDrafts(
			albumValue('a', { birthYear: 1400, deathYear: 1450, country: 'Dania', description: 'Long.' }),
			undefined,
			undefined,
			false
		);

		expect(drafts.subject).toEqual({
			kind: 'author',
			record: { id: '', category: 'author', name: 'a', count: 0 }
		});
		expect(drafts.baseline.author?.birthYear).toBeNull();
		expect(drafts.prefill).toMatchObject({
			summary: 'a summary.',
			notes: 'Long.',
			author: { birthYear: 1400, deathYear: 1450, country: 'Dania' }
		});
		expect(drafts.appendNote).toBeUndefined();
	});

	it('starts a new location with its country and place type', () => {
		const drafts = valueDrafts(
			albumValue('l', { category: 'location', countryCode: 'DE', placeType: 'city' }),
			undefined,
			undefined,
			false
		);

		expect(drafts.baseline.location).toEqual({ countryCode: null, placeType: null });
		expect(drafts.prefill.location).toEqual({ countryCode: 'DE', placeType: 'city' });
	});

	it('starts a new period without person or place details', () => {
		const drafts = valueDrafts(
			albumValue('p', { category: 'period' }),
			undefined,
			undefined,
			false
		);

		expect(drafts.baseline).toEqual({ summary: '', notes: '' });
	});

	it('fills only the empty fields of an existing author', () => {
		const record = { id: 'r', category: 'author' as const, name: 'a', count: 1 };
		const author = {
			image: null,
			birthYear: null,
			deathYear: 1460,
			yearsApproximate: false,
			sortName: null,
			country: null,
			relations: []
		};
		const drafts = valueDrafts(
			albumValue('a', { birthYear: 1400, deathYear: 1450, country: 'Dania' }),
			record,
			{ summary: 'Own.', notes: '', author },
			false
		);

		expect(drafts.subject).toEqual({ kind: 'author', record });
		expect(drafts.prefill).toMatchObject({
			summary: 'Own.',
			author: { birthYear: 1400, deathYear: 1460, country: 'Dania' }
		});
	});

	it('takes the approximate flag from the album when the learner has no years', () => {
		const record = { id: 'r', category: 'author' as const, name: 'a', count: 1 };
		const author = {
			image: null,
			birthYear: null,
			deathYear: null,
			yearsApproximate: false,
			sortName: null,
			country: 'Own',
			relations: []
		};
		const drafts = valueDrafts(
			albumValue('a', { birthYear: 1400, yearsApproximate: true, country: 'Dania' }),
			record,
			{ summary: '', notes: '', author },
			false
		);

		expect(drafts.prefill.author).toMatchObject({
			birthYear: 1400,
			yearsApproximate: true,
			country: 'Own'
		});
	});

	it('fills the empty place details of an existing location', () => {
		const record = { id: 'r', category: 'location' as const, name: 'l', count: 1 };
		const drafts = valueDrafts(
			albumValue('l', { category: 'location', countryCode: 'DE', placeType: 'city' }),
			record,
			{ summary: '', notes: '', location: { countryCode: 'PL', placeType: null } },
			false
		);

		expect(drafts.prefill.location).toEqual({ countryCode: 'PL', placeType: 'city' });
	});

	it('offers the new album text to append to own notes', () => {
		const record = { id: 'r', category: 'author' as const, name: 'a', count: 1 };
		const drafts = valueDrafts(
			albumValue('a', { description: ' New text. ' }),
			record,
			{ summary: '', notes: 'Mine.' },
			true
		);

		expect(drafts.appendNote).toBe('New text.');
		expect(drafts.prefill.notes).toBe('Mine.');
	});
});
