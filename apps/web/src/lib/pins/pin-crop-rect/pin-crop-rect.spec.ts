import { describe, expect, it } from 'vitest';
import { pinCropRect } from './pin-crop-rect.ts';

describe('pinCropRect', () => {
	it('cuts a square as wide as the view around the pin', () => {
		expect(pinCropRect({ x: 0.5, y: 0.5, viewWidth: 0.1 }, 2000, 1000)).toEqual({
			left: 900,
			top: 400,
			side: 200
		});
	});

	it('keeps the square inside the image at its edges', () => {
		expect(pinCropRect({ x: 0, y: 1, viewWidth: 0.1 }, 2000, 1000)).toEqual({
			left: 0,
			top: 800,
			side: 200
		});
	});

	it('shrinks a view taller than the image to its height', () => {
		expect(pinCropRect({ x: 0.5, y: 0.5, viewWidth: 1 }, 2000, 1000)).toEqual({
			left: 500,
			top: 0,
			side: 1000
		});
	});

	it('cuts nothing for a pin without a view', () => {
		expect(pinCropRect({ x: 0.5, y: 0.5 }, 2000, 1000)).toBeUndefined();
	});
});
