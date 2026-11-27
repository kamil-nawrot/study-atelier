import { describe, expect, it, vi } from 'vitest';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { mergeRow, mergeRows, type MergeHandlers } from './merge-rows.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'A', ...overrides };
}

const NONE: MergeChanges = { fields: [], added: [], dropped: [], images: [], droppedImages: [] };

function handlers(): MergeHandlers {
	return { pick: vi.fn(), toggleAdded: vi.fn(), toggleDropped: vi.fn() };
}

describe('mergeRow', () => {
	it('offers both values of a single field to pick and marks a new value', () => {
		const on = handlers();
		const row = mergeRow('location', {
			mine: side({ location: 'Wiedeń' }),
			album: side({ location: 'NHM' }),
			newValues: ['location:NHM'],
			changes: NONE,
			handlers: on
		});

		expect(row).toMatchObject({
			kind: 'pick',
			mine: [{ text: 'Wiedeń' }],
			album: [{ text: 'NHM', isNew: true }],
			fromAlbum: false
		});
		if (row.kind === 'pick') row.onpick(true);
		expect(on.pick).toHaveBeenCalledWith('location', true);
	});

	it('ticks the own items and the added album items of a list', () => {
		const on = handlers();
		const row = mergeRow('materials', {
			mine: side({ materials: ['wapień'] }),
			album: side({ materials: ['Wapień', 'ochra'] }),
			newValues: [],
			changes: { ...NONE, added: ['materials/ochra'] },
			handlers: on
		});

		expect(row).toMatchObject({
			kind: 'tick',
			mine: [{ text: 'wapień', ticked: true }],
			album: [{ text: 'Wapień' }, { text: 'ochra', ticked: true }]
		});
		if (row.kind !== 'tick') return;
		expect(row.album[0].ontoggle).toBeUndefined();
		row.mine[0].ontoggle?.();
		expect(on.toggleDropped).toHaveBeenCalledWith('materials', 'wapień');
	});

	it('shows a value both versions share once', () => {
		const row = mergeRow('title', {
			mine: side({}),
			album: side({ title: 'a' }),
			newValues: [],
			changes: NONE,
			handlers: handlers()
		});

		expect(row).toMatchObject({ kind: 'same', value: [{ text: 'A' }] });
	});

	it('shows a value the album lacks without a choice', () => {
		const row = mergeRow('period', {
			mine: side({ period: 'barok' }),
			album: side({}),
			newValues: [],
			changes: NONE,
			handlers: handlers()
		});

		expect(row).toMatchObject({ kind: 'plain', mine: [{ text: 'barok' }], album: [] });
	});
});

describe('mergeRows', () => {
	it('leaves out the fields empty in both versions', () => {
		const rows = mergeRows({
			mine: side({}),
			album: side({}),
			newValues: [],
			changes: NONE,
			handlers: handlers()
		});

		expect(rows.map((row) => row.key)).not.toContain('period');
	});
});
