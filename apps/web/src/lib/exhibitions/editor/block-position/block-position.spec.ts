import { describe, expect, it } from 'vitest';
import { placed, positionOf } from '#lib/exhibitions/editor/block-position/block-position.ts';

describe('positionOf', () => {
	it('places a block at the top left unless it says otherwise', () => {
		expect(positionOf({ type: 'quote' })).toEqual({ align: 'left', valign: 'top' });
		expect(positionOf(undefined)).toEqual({ align: 'left', valign: 'top' });
		expect(positionOf({ type: 'quote', attrs: { align: 'justify', valign: 3 } })).toEqual({
			align: 'left',
			valign: 'top'
		});
		expect(positionOf({ type: 'quote', attrs: { align: 'right', valign: 'bottom' } })).toEqual({
			align: 'right',
			valign: 'bottom'
		});
	});
});

describe('placed', () => {
	it('stores only a position other than the top left and keeps the other attributes', () => {
		const heading = { type: 'heading', attrs: { level: 2 } };
		expect(placed(heading, { align: 'center', valign: 'middle' })).toEqual({
			type: 'heading',
			attrs: { level: 2, align: 'center', valign: 'middle' }
		});
		expect(
			placed(
				{ type: 'heading', attrs: { level: 2, align: 'center', valign: 'bottom' } },
				{ align: 'left', valign: 'top' }
			)
		).toEqual(heading);
	});
});
