import { describe, expect, it, vi } from 'vitest';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import { m } from '#lib/i18n/i18n.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { mergeRow } from './merge-rows.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'A', ...overrides };
}

const MINE = side({ location: 'Wiedeń' });
const ALBUM = side({ location: 'NHM' });

describe('mergeRow', () => {
	it('offers the action on the album side and marks a new value', () => {
		const ontoggle = vi.fn();
		const row = mergeRow('location', {
			mine: MINE,
			album: ALBUM,
			merged: MINE,
			newValues: ['location:NHM'],
			changes: { fields: [], images: [] },
			ontoggle
		});

		expect(row.left).toEqual([{ text: 'Wiedeń' }]);
		expect(row.right).toEqual([{ text: 'NHM', isNew: true }]);
		expect(row.actions).toMatchObject([{ label: m.compare.replace, side: 'right', toward: true }]);
		row.actions?.[0].onclick();
		expect(ontoggle).toHaveBeenCalledWith('location');
	});

	it('strikes the replaced value through and offers to withdraw the change', () => {
		const row = mergeRow('location', {
			mine: MINE,
			album: ALBUM,
			merged: ALBUM,
			newValues: [],
			changes: { fields: ['location'], images: [] },
			ontoggle: vi.fn()
		});

		expect(row.left).toEqual([{ text: 'Wiedeń', struck: true }, { text: 'NHM' }]);
		expect(row.actions).toMatchObject([{ label: m.compare.withdraw, side: 'left', toward: false }]);
	});

	it('has no action where the album adds nothing', () => {
		const row = mergeRow('title', {
			mine: MINE,
			album: ALBUM,
			merged: MINE,
			newValues: [],
			changes: { fields: [], images: [] },
			ontoggle: vi.fn()
		});

		expect(row.actions).toBeUndefined();
	});
});
