import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPixels } from './image-pixels.ts';

async function picture(width: number, height: number): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('no canvas');
	context.fillStyle = '#c81414';
	context.fillRect(0, 0, width, height);
	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no blob'))), 'image/png')
	);
}

describe('readPixels', () => {
	afterEach(() => vi.restoreAllMocks());

	it('decodes the image already shrunk to the sample, keeping its proportions', async () => {
		const decode = vi.spyOn(globalThis, 'createImageBitmap');
		const blob = await picture(400, 200);

		const pixels = await readPixels(blob, { width: 4000, height: 2000 });

		expect(decode).toHaveBeenCalledWith(blob, {
			resizeWidth: 64,
			resizeHeight: 32,
			resizeQuality: 'high'
		});
		expect(pixels?.length).toBe(64 * 32 * 4);
		expect([...(pixels ?? []).slice(0, 4)]).toEqual([200, 20, 20, 255]);
	});

	it('samples a square when the proportions are not known', async () => {
		const pixels = await readPixels(await picture(300, 100));

		expect(pixels?.length).toBe(64 * 64 * 4);
	});

	it('does not enlarge an image smaller than the sample', async () => {
		const pixels = await readPixels(await picture(10, 20), { width: 10, height: 20 });

		expect(pixels?.length).toBe(10 * 20 * 4);
	});

	it('returns nothing for data that is not an image', async () => {
		expect(await readPixels(new Blob(['not an image'], { type: 'image/png' }))).toBeUndefined();
	});
});
