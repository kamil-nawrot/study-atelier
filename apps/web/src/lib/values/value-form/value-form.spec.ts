import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { eraName } from '#lib/catalogue/eras/eras.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import {
	initialValueForm,
	mergeDescription,
	moveDescription,
	sameItems,
	valueFormChanged
} from './value-form.ts';

const index = { values: [], periodEras: [], stylePeriods: [] };
const details = { summary: 'Summary', notes: '' };

function record(overrides: Partial<CardIndexRecord> = {}): CardIndexRecord {
	return { id: 'value-1', category: 'material', name: 'Oil', count: 2, ...overrides };
}

describe('value form', () => {
	it('starts from the record name and details, with author and place only for their kinds', () => {
		const form = initialValueForm(record(), index, details);

		expect(form).toMatchObject({ name: 'Oil', details, author: null, location: null });
		expect(initialValueForm(record({ category: 'location' }), index, details).location).toEqual({
			countryCode: null,
			placeType: null
		});
	});

	it('compares lists regardless of order', () => {
		expect(sameItems(['a', 'b'], ['b', 'a'])).toBe(true);
		expect(sameItems(['a'], ['a', 'b'])).toBe(false);
	});

	it('sees a change in the trimmed name but not in spaces around it', () => {
		const saved = initialValueForm(record(), index, details);

		expect(valueFormChanged({ ...saved, name: ' Oil ' }, saved)).toBe(false);
		expect(valueFormChanged({ ...saved, name: 'Tempera' }, saved)).toBe(true);
	});

	it('describes a move to the only remaining era', () => {
		const period = record({ category: 'period', name: 'Baroque' });

		expect(
			moveDescription(period, { count: 3, removed: ['middle_ages'], remaining: ['early_modern'] })
		).toBe(
			m.cardIndex.moveConfirm.toEra('Baroque', eraName('middle_ages'), 3, eraName('early_modern'))
		);
	});

	it('warns that merging an unused value only changes the card index', () => {
		expect(
			mergeDescription(record({ count: 0 }), record({ name: 'Oil paint' }), 'materiału', false)
		).toBe(
			[m.cardIndex.mergeConfirm.unused('Oil'), m.cardIndex.mergeConfirm.irreversible].join(' ')
		);
	});

	it('says the visits of a place without artworks move to the kept place', () => {
		const louvre = record({ category: 'location', name: 'Luwr', count: 0, visits: 2 });

		expect(mergeDescription(louvre, record({ name: 'Louvre' }), 'miejsca', false)).toBe(
			[
				m.cardIndex.mergeConfirm.visits('Luwr', 'Louvre', 2),
				m.cardIndex.mergeConfirm.irreversible
			].join(' ')
		);
	});

	it('says the visits move with the artworks of a place', () => {
		const louvre = record({ category: 'location', name: 'Luwr', count: 3, visits: 1 });

		expect(mergeDescription(louvre, record({ name: 'Louvre' }), 'miejsca', false)).toBe(
			[
				m.cardIndex.mergeConfirm.assigned('Luwr', 'Louvre', 3, 'miejsca'),
				m.cardIndex.mergeConfirm.visits('Luwr', 'Louvre', 1),
				m.cardIndex.mergeConfirm.irreversible
			].join(' ')
		);
	});
});
