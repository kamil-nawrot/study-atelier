import { describe, expect, it } from 'vitest';
import { scrollForDrag, thumbGeometry } from './overlay-scrollbar.ts';

describe('thumbGeometry', () => {
	it('gives nothing when the content fits', () => {
		expect(thumbGeometry(300, 300, 0)).toBeNull();
		expect(thumbGeometry(0, 500, 0)).toBeNull();
	});

	it('sizes the thumb by the share of the content in view', () => {
		expect(thumbGeometry(300, 1200, 0)).toEqual({ offset: 0, length: 75 });
	});

	it('moves the thumb from the top to the bottom of its track', () => {
		expect(thumbGeometry(300, 1200, 450)?.offset).toBe(112);
		expect(thumbGeometry(300, 1200, 900)?.offset).toBe(225);
		expect(thumbGeometry(300, 1200, 2000)?.offset).toBe(225);
	});

	it('keeps a thumb at least 24 px long', () => {
		expect(thumbGeometry(300, 100000, 0)?.length).toBe(24);
	});
});

describe('scrollForDrag', () => {
	it('scrolls the content in proportion to the thumb', () => {
		expect(scrollForDrag(225, 300, 1200, 75)).toBe(900);
		expect(scrollForDrag(-10, 300, 1200, 75)).toBe(-40);
	});

	it('does not scroll when the thumb fills its track', () => {
		expect(scrollForDrag(50, 300, 300, 300)).toBe(0);
	});
});
