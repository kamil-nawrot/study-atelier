import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { groupLabel, groupTiles, pinTiles } from './flag-tiles.ts';

describe('flag tiles', () => {
	it('names the group after its item', () => {
		expect(groupLabel({ kind: 'artwork', id: 'a', title: 'Saint Jerome' })).toBe(
			m.backroom.groups.artwork('Saint Jerome')
		);
		expect(groupLabel({ kind: 'term', id: 't', name: 'Vanitas' })).toBe(
			m.backroom.groups.term('Vanitas')
		);
		expect(groupLabel({ kind: 'symbol', id: 's', name: 'Skull' })).toBe(
			m.backroom.groups.symbol('Skull')
		);
	});

	it('gives every reason of a group its tile in order', () => {
		expect(
			groupTiles({ item: { kind: 'term', id: 't', name: 'Vanitas' }, reasons: ['hidden', 'other'] })
		).toEqual([
			{ value: 'hidden', label: m.backroom.reasons.hidden },
			{ value: 'other', label: m.backroom.reasons.other }
		]);
	});

	it('numbers the pins to choose from', () => {
		expect(pinTiles([{ id: 'p', imageId: 'i', number: 2, name: 'Skull' }])).toEqual([
			{ value: 'p', label: m.pins.marker(2, 'Skull') }
		]);
	});
});
