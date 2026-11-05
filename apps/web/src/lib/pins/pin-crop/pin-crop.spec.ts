import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { savePinCrop } from '#lib/pins/pin-crop-data/pin-crop-data.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import { cutPinCrop, ensurePinCrops, PIN_CROP_SIDE } from './pin-crop.ts';

vi.mock('#lib/pins/pin-crop-data/pin-crop-data.ts', () => ({ savePinCrop: vi.fn() }));

const image: ArtworkImageInput = {
	id: 'image-1',
	kind: 'url',
	url: 'https://images.example.test/mirror.jpg',
	width: 2000,
	height: 1000
};

function viewPin(id: string, overrides: Partial<Pin> = {}): Pin {
	return {
		id,
		imageId: 'image-1',
		x: 0.5,
		y: 0.5,
		glossaryEntryId: null,
		text: '',
		viewWidth: 0.1,
		...overrides
	};
}

const drawn: unknown[][] = [];

function stubCanvas(blob: Blob | null): void {
	vi.stubGlobal(
		'createImageBitmap',
		vi.fn().mockResolvedValue({ width: 2000, height: 1000, close: vi.fn() })
	);
	const canvas = {
		width: 0,
		height: 0,
		getContext: () => ({
			fillRect: vi.fn(),
			drawImage: (...args: unknown[]) => drawn.push(args),
			fillStyle: ''
		}),
		toBlob: (callback: (result: Blob | null) => void) => callback(blob)
	};
	vi.stubGlobal('document', { createElement: () => canvas });
}

async function settled(): Promise<void> {
	await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
	await drained();
}

async function drained(): Promise<void> {
	for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
}

describe('cutPinCrop', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		drawn.length = 0;
	});

	it('draws the view into a small square jpeg', async () => {
		const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' });
		stubCanvas(jpeg);

		await expect(cutPinCrop(new Blob(), { x: 0.5, y: 0.5, viewWidth: 0.1 })).resolves.toBe(jpeg);
		expect(drawn[0].slice(1)).toEqual([900, 400, 200, 200, 0, 0, PIN_CROP_SIDE, PIN_CROP_SIDE]);
	});

	it('gives up when the image cannot be read', async () => {
		vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('tainted')));

		await expect(cutPinCrop(new Blob(), { x: 0.5, y: 0.5, viewWidth: 0.1 })).resolves.toBe(
			undefined
		);
	});
});

describe('ensurePinCrops', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		stubCanvas(new Blob(['jpeg'], { type: 'image/jpeg' }));
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) })
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('cuts and saves a crop for a view pin without one, once per view', async () => {
		const pin = viewPin('needs-crop');

		ensurePinCrops([image], [pin]);
		ensurePinCrops([image], [pin]);
		await settled();
		await vi.waitFor(() => expect(savePinCrop).toHaveBeenCalledTimes(1));

		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(image.url, { mode: 'cors' });
		expect(vi.mocked(savePinCrop).mock.calls[0][0]).toBe(pin);
	});

	it('leaves pins without a view, with a crop or without their image alone', async () => {
		ensurePinCrops(
			[image],
			[
				viewPin('plain', { viewWidth: undefined }),
				viewPin('cropped', { cropPath: 'owner/cropped-crop-1.jpg' }),
				viewPin('elsewhere', { imageId: 'image-2' })
			]
		);
		await drained();

		expect(fetch).not.toHaveBeenCalled();
	});

	it('saves nothing when the image server refuses the image', async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

		ensurePinCrops([image], [viewPin('refused')]);
		await settled();

		expect(savePinCrop).not.toHaveBeenCalled();
	});
});
