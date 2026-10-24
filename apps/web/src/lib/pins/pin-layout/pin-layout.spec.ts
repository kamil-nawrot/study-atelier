import { describe, expect, it } from 'vitest';
import { fractionIn, nudged, pinsOfImage } from './pin-layout.ts';
import type { Pin } from '#lib/pins/types.ts';

const rect = { left: 100, top: 50, width: 400, height: 200 };

function pin(id: string, imageId: string): Pin {
	return { id, imageId, x: 0.5, y: 0.5, glossaryEntryId: null, text: 'Lily' };
}

describe('pin layout', () => {
	it('turns a point on the image into fractions of its width and height', () => {
		expect(fractionIn(300, 100, rect)).toEqual({ x: 0.5, y: 0.25 });
	});

	it('keeps a point outside the image on its edge', () => {
		expect(fractionIn(50, 400, rect)).toEqual({ x: 0, y: 1 });
		expect(fractionIn(900, 0, rect)).toEqual({ x: 1, y: 0 });
	});

	it('puts a pin in the middle of an image that has no size yet', () => {
		expect(fractionIn(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
			x: 0.5,
			y: 0.5
		});
	});

	it('picks the pins of one image', () => {
		const pins = [pin('a', 'one'), pin('b', 'two'), pin('c', 'one')];

		expect(pinsOfImage(pins, 'one').map((item) => item.id)).toEqual(['a', 'c']);
		expect(pinsOfImage(pins, undefined)).toEqual([]);
	});

	it('moves a pin with the arrow keys and keeps it on the image', () => {
		expect(nudged({ x: 0.5, y: 0.5 }, 'ArrowRight')).toEqual({ x: 0.52, y: 0.5 });
		expect(nudged({ x: 0.5, y: 0.5 }, 'ArrowUp')).toEqual({ x: 0.5, y: 0.48 });
		expect(nudged({ x: 0, y: 1 }, 'ArrowLeft')).toEqual({ x: 0, y: 1 });
		expect(nudged({ x: 0, y: 1 }, 'ArrowDown')).toEqual({ x: 0, y: 1 });
		expect(nudged({ x: 0.5, y: 0.5 }, 'Enter')).toBeUndefined();
	});
});
