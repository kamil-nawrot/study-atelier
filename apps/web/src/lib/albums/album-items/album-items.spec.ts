import { describe, expect, it } from 'vitest';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { albumValue, albumWithItems } from '#lib/testing/albums/albums.ts';
import type { AlbumItem } from '#lib/albums/types/album-item.ts';
import type { AlbumItemState } from '#lib/albums/types/album-item-state.ts';
import type { ItemMatches } from '#lib/albums/types/item-matches.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import {
	albumItems,
	hasNewDescription,
	itemsOfPart,
	selectableItem,
	startsSelected
} from './album-items.ts';

const NOTHING: ItemMatches = { entries: [], events: [], records: [], details: {} };

function itemOf(items: AlbumItem[], key: string): AlbumItem {
	const item = items.find((candidate) => candidate.key === key);
	if (!item) throw new Error(key);
	return item;
}

describe('albumItems', () => {
	it('lists the terms, figures, events and described values of an album', () => {
		const items = albumItems(albumWithItems(), NOTHING, []);

		expect(items.map((item) => item.key)).toEqual([
			'term:carving',
			'term:sculptor',
			'term:unrelated',
			'event:discovery',
			'value:carver',
			'value:cave'
		]);
		expect(itemsOfPart(items, 'figures').map((item) => item.title)).toEqual(['Sculptor']);
		expect(items.every((item) => item.state === 'new')).toBe(true);
	});

	it('marks what belongs to the saved artworks as related and ticks it from the start', () => {
		const items = albumItems(albumWithItems(), NOTHING, ['venus']);

		expect(items.filter((item) => item.related).map((item) => item.key)).toEqual([
			'term:carving',
			'event:discovery',
			'value:carver'
		]);
		expect(startsSelected(itemOf(items, 'term:carving'))).toBe(true);
		expect(startsSelected(itemOf(items, 'term:unrelated'))).toBe(false);
	});

	it('knows a term the learner has by name or by alternative name', () => {
		const matches = {
			...NOTHING,
			entries: [testEntry('a-1', 'carving', { definition: 'Own text.' })]
		};
		const items = albumItems(albumWithItems(), matches, ['venus']);
		const item = itemOf(items, 'term:carving');

		expect(item.state).toBe('present');
		expect(selectableItem(item)).toBe(false);
		expect(startsSelected(item)).toBe(false);
	});

	it('offers to fill a term that has no definition yet', () => {
		const matches = {
			...NOTHING,
			entries: [testEntry('a-1', 'Carving', { definition: '' })]
		};

		expect(itemOf(albumItems(albumWithItems(), matches, []), 'term:carving').state).toBe('fill');
	});

	it('treats an entry of another kind as present', () => {
		const matches = {
			...NOTHING,
			entries: [testEntry('a-1', 'Sculptor', { definition: '', category: 'architecture' })]
		};

		expect(itemOf(albumItems(albumWithItems(), matches, []), 'term:sculptor').state).toBe(
			'present'
		);
	});

	it('fills a figure that lacks life years or country', () => {
		const figure = testEntry('a-2', 'Sculptor', { category: 'artist', definition: 'Own.' });
		const matches = {
			...NOTHING,
			entries: [
				{
					...figure,
					figure: {
						image: null,
						birthYear: null,
						deathYear: -430,
						yearsApproximate: false,
						country: 'Grecja'
					}
				}
			]
		};

		expect(itemOf(albumItems(albumWithItems(), matches, []), 'term:sculptor').state).toBe('fill');
	});

	it('compares events by name and fills an empty description', () => {
		const own = {
			id: 'e-1',
			name: 'discovery',
			yearFrom: null,
			yearTo: 1908,
			yearApproximate: false,
			description: '',
			source: null
		};

		expect(
			itemOf(albumItems(albumWithItems(), { ...NOTHING, events: [own] }, []), 'event:discovery')
				.state
		).toBe('fill');
		expect(
			itemOf(
				albumItems(
					albumWithItems(),
					{ ...NOTHING, events: [{ ...own, description: 'Mine.' }] },
					[]
				),
				'event:discovery'
			).state
		).toBe('present');
	});

	it('reads the state of a value from its saved details', () => {
		const record = { id: 'r-1', category: 'author' as const, name: 'unknown carver', count: 1 };
		const album = albumWithItems();
		const state = (details?: ValueDetails): AlbumItemState =>
			itemOf(
				albumItems(
					album,
					{ ...NOTHING, records: [record], details: details ? { 'r-1': details } : {} },
					[]
				),
				'value:carver'
			).state;

		expect(state({ summary: 'Own.', notes: 'Own notes.' })).toBe('description');
		expect(state({ summary: '', notes: 'A carver of figures.' })).toBe('fill');
		expect(state({ summary: 'Own.', notes: '' })).toBe('fill');
		expect(
			state({
				summary: 'Own.',
				notes: 'A carver of figures.',
				author: {
					image: null,
					birthYear: null,
					deathYear: null,
					yearsApproximate: false,
					sortName: null,
					country: null,
					relations: []
				}
			})
		).toBe('present');
		expect(state()).toBe('present');
	});

	it('fills the years, country and place of a value that lack them', () => {
		const album = {
			...albumWithItems(),
			values: [
				albumValue('a', {
					name: 'A',
					summary: 'Painter.',
					description: null,
					birthYear: 1400,
					country: 'Dania'
				}),
				albumValue('b', { category: 'location', name: 'B', placeType: 'city', description: 'x' })
			]
		};
		const records = [
			{ id: 'ra', category: 'author' as const, name: 'A', count: 0 },
			{ id: 'rb', category: 'location' as const, name: 'B', count: 0 }
		];
		const author = {
			image: null,
			birthYear: null,
			deathYear: 1500,
			yearsApproximate: false,
			sortName: null,
			country: null,
			relations: []
		};
		const details = {
			ra: { summary: '', notes: '', author },
			rb: { summary: '', notes: 'x', location: { countryCode: null, placeType: null } }
		};
		const items = itemsOfPart(albumItems(album, { ...NOTHING, records, details }, []), 'values');

		expect(items.map((item) => item.state)).toEqual(['fill', 'fill']);
	});
});

describe('hasNewDescription', () => {
	it('is true only when the learner has notes that lack the album text', () => {
		const value = albumValue('v', { description: ' Album text. ' });

		expect(hasNewDescription(value, { summary: '', notes: 'Mine.' })).toBe(true);
		expect(hasNewDescription(value, { summary: '', notes: 'Mine. Album text.' })).toBe(false);
		expect(hasNewDescription(value, { summary: '', notes: '' })).toBe(false);
	});
});
