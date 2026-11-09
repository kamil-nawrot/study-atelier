import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { fetchImageThroughProxy } from '#lib/images/image-proxy-data/image-proxy-data.ts';
import { readPixels } from '#lib/images/image-pixels/image-pixels.ts';
import { savePalette } from '#lib/images/palette-data/palette-data.ts';
import { paletteOf } from './image-palette.ts';

vi.mock('#lib/images/palette-data/palette-data.ts', () => ({ savePalette: vi.fn() }));
vi.mock('#lib/images/image-proxy-data/image-proxy-data.ts', () => ({
	fetchImageThroughProxy: vi.fn()
}));
vi.mock('#lib/images/image-pixels/image-pixels.ts', () => ({ readPixels: vi.fn() }));

const RED = 'https://images.example.test/red.jpg';
const RED_PIXELS = Uint8ClampedArray.from([200, 20, 20, 255, 200, 20, 20, 255]);

function linked(id: string | undefined, url = RED): ArtworkImageInput {
	return { ...(id ? { id } : {}), kind: 'url', url, width: 8, height: 8 };
}

describe('paletteOf', () => {
	beforeEach(() => {
		vi.mocked(savePalette).mockReset().mockResolvedValue(true);
		vi.mocked(fetchImageThroughProxy).mockReset().mockResolvedValue(undefined);
		vi.mocked(readPixels).mockReset().mockResolvedValue(RED_PIXELS);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) })
		);
	});

	it('returns the stored palette without reading the image', async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		const palette = [{ color: '#aa8855', share: 1 }];

		const result = await paletteOf({ ...linked('stored-1'), palette });

		expect(result).toEqual({ colours: palette });
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(savePalette).not.toHaveBeenCalled();
	});

	it('computes the palette of an image and stores it once', async () => {
		const first = await paletteOf(linked('fresh-1'));
		const second = await paletteOf(linked('fresh-1'));

		expect(first).toEqual({ colours: [{ color: '#c81414', share: 1 }] });
		expect(second).toEqual(first);
		expect(savePalette).toHaveBeenCalledTimes(1);
		expect(savePalette).toHaveBeenCalledWith(linked('fresh-1'), [{ color: '#c81414', share: 1 }]);
	});

	it('computes again when the image behind the id has changed', async () => {
		await paletteOf(linked('changed-1'));
		await paletteOf(linked('changed-1', 'https://images.example.test/other.jpg'));

		expect(savePalette).toHaveBeenCalledTimes(2);
	});

	it('reports an image that cannot be fetched and does not store anything', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('blocked')));

		const result = await paletteOf(linked('blocked-1'));

		expect(result).toEqual({ unreadable: true });
		expect(savePalette).not.toHaveBeenCalled();
	});

	it('reports an image the host refuses', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

		expect(await paletteOf(linked('refused-1'))).toEqual({ unreadable: true });
	});

	it('remembers an image that cannot be read for the session', async () => {
		const failing = vi.fn().mockRejectedValue(new TypeError('blocked'));
		vi.stubGlobal('fetch', failing);

		await paletteOf(linked('unreadable-1'));
		const again = await paletteOf(linked('unreadable-1'));

		expect(again).toEqual({ unreadable: true });
		expect(failing).toHaveBeenCalledTimes(1);
		expect(fetchImageThroughProxy).toHaveBeenCalledTimes(1);
	});

	it('reads an image once when two views ask for its palette at the same time', async () => {
		const [first, second] = await Promise.all([
			paletteOf(linked('parallel-1')),
			paletteOf(linked('parallel-1'))
		]);

		expect(second).toEqual(first);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(readPixels).toHaveBeenCalledTimes(1);
		expect(savePalette).toHaveBeenCalledTimes(1);
	});

	it('returns the colours without waiting for them to be stored', async () => {
		vi.mocked(savePalette).mockReturnValue(new Promise(() => {}));

		expect(await paletteOf(linked('unsaved-1'))).toEqual({
			colours: [{ color: '#c81414', share: 1 }]
		});
	});

	it('returns the colours when storing them fails', async () => {
		vi.mocked(savePalette).mockRejectedValue(new Error('offline'));

		expect(await paletteOf(linked('offline-1'))).toEqual({
			colours: [{ color: '#c81414', share: 1 }]
		});
	});

	it('does not store the palette of an image that has no id yet', async () => {
		const result = await paletteOf(linked(undefined));

		expect(result).toEqual({ colours: [{ color: '#c81414', share: 1 }] });
		expect(savePalette).not.toHaveBeenCalled();
	});

	it('reads an image of a host without CORS through the proxy', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('blocked')));
		const proxied = new Blob(['x']);
		vi.mocked(fetchImageThroughProxy).mockResolvedValue(proxied);

		const result = await paletteOf(linked('proxied-1'));

		expect(fetchImageThroughProxy).toHaveBeenCalledWith(RED);
		expect(readPixels).toHaveBeenCalledWith(proxied);
		expect(result).toEqual({ colours: [{ color: '#c81414', share: 1 }] });
		expect(savePalette).toHaveBeenCalledWith(linked('proxied-1'), [{ color: '#c81414', share: 1 }]);
	});

	it('does not use the proxy for an image the host refuses', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

		await paletteOf(linked('refused-2'));

		expect(fetchImageThroughProxy).not.toHaveBeenCalled();
	});

	it('does not use the proxy for an image that is not a linked one', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('blocked')));

		const result = await paletteOf({
			id: 'own-1',
			kind: 'upload',
			path: 'user/own.jpg',
			previewUrl: 'https://project.example.test/own.jpg',
			width: 8,
			height: 8
		});

		expect(fetchImageThroughProxy).not.toHaveBeenCalled();
		expect(result).toEqual({ unreadable: true });
	});
});
