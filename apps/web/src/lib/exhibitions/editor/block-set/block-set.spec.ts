import { describe, expect, it } from 'vitest';
import { canGrow, itemsOf, withItem, withoutItem } from './block-set.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

const palette = (artworkId: string): ExhibitionDocument => ({
	type: 'artwork',
	attrs: { artworkId, paletteOnly: true }
});

describe('block sets', () => {
	it('turns a block into a set of two and keeps where the block stood on the set', () => {
		const block = {
			type: 'artwork',
			attrs: { artworkId: 'a', paletteOnly: true, align: 'center' }
		};

		expect(withItem(block, palette('b'))).toEqual({
			type: 'set',
			attrs: { align: 'center' },
			content: [palette('a'), palette('b')]
		});
	});

	it('adds to the end of a set and stops at five items', () => {
		let set = withItem(palette('a'), palette('b'));
		for (const id of ['c', 'd', 'e', 'f']) set = withItem(set, palette(id));

		expect(itemsOf(set).map((item) => item.attrs?.artworkId)).toEqual(['a', 'b', 'c', 'd', 'e']);
		expect(canGrow(set)).toBe(false);
		expect(canGrow(palette('a'))).toBe(true);
	});

	it('removes an item and leaves an ordinary block when one is left', () => {
		const set = withItem(
			withItem(
				{ ...palette('a'), attrs: { ...palette('a').attrs, valign: 'bottom' } },
				palette('b')
			),
			palette('c')
		);

		const two = withoutItem(set, 1);
		expect(itemsOf(two).map((item) => item.attrs?.artworkId)).toEqual(['a', 'c']);
		expect(withoutItem(two, 0)).toEqual({
			type: 'artwork',
			attrs: { artworkId: 'c', paletteOnly: true, valign: 'bottom' }
		});
	});

	it('leaves a block that is not a set as it is', () => {
		expect(itemsOf(palette('a'))).toEqual([palette('a')]);
		expect(withoutItem(palette('a'), 0)).toEqual(palette('a'));
	});
});
