import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageApiError } from '@supabase/supabase-js';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_MAX_MEGABYTES,
	OWN_IMAGE_MAX_SOURCE_BYTES,
	OWN_IMAGE_MAX_SOURCE_MEGABYTES,
	SIGNED_URL_SECONDS
} from './bucket.ts';
import {
	fitOwnImage,
	ownImageFileError,
	ownImagePath,
	makeThumbnail,
	ownImageUrl,
	parseImageUrl,
	readImageSize,
	removeOwnImage,
	uploadOwnImage
} from './own-image.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn() }, storage: { from: vi.fn() } }
}));

const bucket = { upload: vi.fn(), remove: vi.fn(), createSignedUrl: vi.fn() };

function file(type: string, size = 100, name = 'photo'): File {
	return new File([new Uint8Array(size)], name, { type });
}

function sized(source: File, size: number): File {
	Object.defineProperty(source, 'size', { value: size });
	return source;
}

type ImageOutcome = { width: number; height: number } | 'error';

function stubImage(outcomes: Record<string, ImageOutcome>): void {
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 0;
			naturalHeight = 0;
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(value: string) {
				const outcome = outcomes[value] ?? 'error';
				setTimeout(() => {
					if (outcome === 'error') {
						this.onerror?.();
						return;
					}
					this.naturalWidth = outcome.width;
					this.naturalHeight = outcome.height;
					this.onload?.();
				});
			}
		}
	);
}

describe('ownImageFileError', () => {
	it('accepts every image type the bucket allows', () => {
		for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']) {
			expect(ownImageFileError(file(type))).toBeUndefined();
		}
	});

	it('names the allowed formats for a file of another type', () => {
		expect(ownImageFileError(file('image/heic'))).toBe(
			m.ownImageErrors.fileType('JPG, PNG, WebP, GIF lub AVIF')
		);
		expect(ownImageFileError(file('application/pdf'))).toBe(
			m.ownImageErrors.fileType('JPG, PNG, WebP, GIF lub AVIF')
		);
	});

	it('names the limit for a file too large to make smaller', () => {
		expect(
			ownImageFileError(sized(file('image/jpeg'), OWN_IMAGE_MAX_SOURCE_BYTES))
		).toBeUndefined();
		expect(ownImageFileError(sized(file('image/jpeg'), OWN_IMAGE_MAX_SOURCE_BYTES + 1))).toBe(
			m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_SOURCE_MEGABYTES)
		);
	});

	it('rejects an empty file', () => {
		expect(ownImageFileError(file('image/png', 0))).toBe(m.ownImageErrors.fileUnreadable);
	});
});

describe('parseImageUrl', () => {
	it('accepts a full https address without the surrounding spaces', () => {
		expect(parseImageUrl('  https://example.com/images/painting.jpg ')).toEqual({
			url: 'https://example.com/images/painting.jpg'
		});
	});

	it('asks for an address when the field is empty', () => {
		expect(parseImageUrl('   ')).toEqual({ error: m.ownImageErrors.urlRequired });
	});

	it('rejects an address that is not https or not a full address', () => {
		for (const text of [
			'http://example.com/painting.jpg',
			'example.com/painting.jpg',
			'data:image/png;base64,AAAA',
			'https://'
		]) {
			expect(parseImageUrl(text)).toEqual({ error: m.ownImageErrors.urlInvalid });
		}
	});
});

describe('readImageSize', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reads the natural width and height of a loaded image', async () => {
		stubImage({ 'https://example.com/a.jpg': { width: 1200, height: 900 } });

		await expect(readImageSize('https://example.com/a.jpg')).resolves.toEqual({
			width: 1200,
			height: 900
		});
	});

	it('fails when the image does not load', async () => {
		stubImage({});

		await expect(readImageSize('https://example.com/missing.jpg')).rejects.toThrow();
	});

	it('fails when the image has no size', async () => {
		stubImage({ 'https://example.com/empty.svg': { width: 0, height: 0 } });

		await expect(readImageSize('https://example.com/empty.svg')).rejects.toThrow();
	});
});

function stubThumbnail(blob: Blob | undefined): void {
	vi.stubGlobal(
		'createImageBitmap',
		vi.fn().mockResolvedValue({ width: 2000, height: 1000, close: vi.fn() })
	);
	const canvas = {
		width: 0,
		height: 0,
		getContext: () => ({ fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }),
		toBlob: (callback: (result: Blob | null) => void) => callback(blob ?? null)
	};
	vi.stubGlobal('document', { createElement: () => canvas });
	thumbnailCanvas = canvas;
}

let thumbnailCanvas: { width: number; height: number } | undefined;

describe('makeThumbnail', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('scales a wide image down to 500 px and keeps its proportions', async () => {
		stubThumbnail(new Blob(['small'], { type: 'image/jpeg' }));

		const result = await makeThumbnail(file('image/png'));

		expect(result?.type).toBe('image/jpeg');
		expect(thumbnailCanvas).toMatchObject({ width: 500, height: 250 });
	});

	it('does not enlarge a small image', async () => {
		stubThumbnail(new Blob(['small'], { type: 'image/jpeg' }));
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn().mockResolvedValue({ width: 300, height: 200, close: vi.fn() })
		);

		await makeThumbnail(file('image/png'));

		expect(thumbnailCanvas).toMatchObject({ width: 300, height: 200 });
	});

	it('gives nothing when the browser cannot encode a JPEG or read the file', async () => {
		stubThumbnail(new Blob(['png'], { type: 'image/png' }));
		await expect(makeThumbnail(file('image/png'))).resolves.toBeUndefined();

		vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad')));
		await expect(makeThumbnail(file('image/png'))).resolves.toBeUndefined();
	});
});

function stubSmaller(bitmap: { width: number; height: number }, sizes: number[]): number[][] {
	const drawn: number[][] = [];
	vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ ...bitmap, close: vi.fn() }));
	const canvas = {
		width: 0,
		height: 0,
		getContext: () => ({ fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }),
		toBlob: (callback: (result: Blob | null) => void) => {
			drawn.push([canvas.width, canvas.height]);
			callback(new Blob([new Uint8Array(sizes[drawn.length - 1] ?? 1)], { type: 'image/jpeg' }));
		}
	};
	vi.stubGlobal('document', { createElement: () => canvas });
	return drawn;
}

describe('fitOwnImage', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('keeps a file within the limit as it is', async () => {
		const small = file('image/png', OWN_IMAGE_MAX_BYTES, 'photo.png');

		await expect(fitOwnImage(small)).resolves.toEqual({ file: small });
	});

	it('cuts the longer side to 3200 px and saves a JPEG', async () => {
		const drawn = stubSmaller({ width: 3000, height: 8000 }, [1000]);

		const result = await fitOwnImage(
			sized(file('image/png', 1, 'scan.png'), OWN_IMAGE_MAX_BYTES + 1)
		);

		expect(drawn).toEqual([[1200, 3200]]);
		expect('file' in result && result.file).toMatchObject({ name: 'scan.jpg', type: 'image/jpeg' });
	});

	it('goes down to 2400 and 1600 px while the JPEG is still over the limit', async () => {
		const drawn = stubSmaller({ width: 8000, height: 6000 }, [
			OWN_IMAGE_MAX_BYTES + 1,
			OWN_IMAGE_MAX_BYTES + 1,
			1000
		]);

		const result = await fitOwnImage(sized(file('image/jpeg'), OWN_IMAGE_MAX_BYTES + 1));

		expect(drawn).toEqual([
			[3200, 2400],
			[2400, 1800],
			[1600, 1200]
		]);
		expect('file' in result).toBe(true);
	});

	it('does not enlarge an image whose file is large for its size', async () => {
		const drawn = stubSmaller({ width: 2000, height: 1000 }, [1000]);

		await fitOwnImage(sized(file('image/png'), OWN_IMAGE_MAX_BYTES + 1));

		expect(drawn).toEqual([[2000, 1000]]);
	});

	it('gives up when even 1600 px is over the limit or the file cannot be read', async () => {
		stubSmaller({ width: 8000, height: 6000 }, [
			OWN_IMAGE_MAX_BYTES + 1,
			OWN_IMAGE_MAX_BYTES + 1,
			OWN_IMAGE_MAX_BYTES + 1
		]);
		await expect(fitOwnImage(sized(file('image/jpeg'), OWN_IMAGE_MAX_BYTES + 1))).resolves.toEqual({
			error: m.ownImageErrors.shrinkFailed
		});

		vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad')));
		await expect(fitOwnImage(sized(file('image/jpeg'), OWN_IMAGE_MAX_BYTES + 1))).resolves.toEqual({
			error: m.ownImageErrors.shrinkFailed
		});
	});
});

describe('ownImagePath', () => {
	it('puts the file in the owner folder under a new name with the extension of its type', () => {
		const path = ownImagePath('user-id', file('image/jpeg', 100, 'My holiday photo.jpeg'));

		expect(path).toMatch(/^user-id\/[0-9a-f-]{36}\.jpg$/);
		expect(path).not.toBe(ownImagePath('user-id', file('image/jpeg')));
	});

	it('uses the extension that matches each type', () => {
		expect(ownImagePath('user-id', file('image/webp'))).toMatch(/\.webp$/);
		expect(ownImagePath('user-id', file('image/avif'))).toMatch(/\.avif$/);
	});
});

describe('uploadOwnImage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
		bucket.upload.mockResolvedValue({ data: { path: 'ignored' }, error: null });
		bucket.remove.mockResolvedValue({ data: [], error: null });
	});

	it('uploads the file to the learner folder in the images bucket', async () => {
		const photo = file('image/png');

		const result = await uploadOwnImage(photo);

		expect(result.path).toMatch(/^user-id\/[0-9a-f-]{36}\.png$/);
		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(bucket.upload).toHaveBeenCalledWith(result.path, photo, {
			contentType: 'image/png',
			upsert: false
		});
	});

	it('also uploads a small copy next to the original', async () => {
		const small = new Blob(['small'], { type: 'image/jpeg' });
		stubThumbnail(small);

		const result = await uploadOwnImage(file('image/png'));

		expect(bucket.upload).toHaveBeenCalledTimes(2);
		expect(bucket.upload).toHaveBeenLastCalledWith(
			(result.path as string).replace('.png', '-thumb.jpg'),
			small,
			{ contentType: 'image/jpeg', upsert: false }
		);
	});

	it('keeps the original when the small copy cannot be made or uploaded', async () => {
		stubThumbnail(undefined);

		const result = await uploadOwnImage(file('image/png'));

		expect(result.path).toMatch(/\.png$/);
		expect(result.error).toBeUndefined();
		expect(bucket.upload).toHaveBeenCalledOnce();
	});

	it('returns the dictionary message when the bucket refuses the file', async () => {
		bucket.upload.mockResolvedValue({
			data: null,
			error: new StorageApiError('Payload too large', 413, '413', 'storage', 'EntityTooLarge')
		});

		await expect(uploadOwnImage(file('image/png'))).resolves.toEqual({
			error: m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES)
		});
	});

	it('does not upload without a signed-in learner', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: null },
			error: null
		});

		await expect(uploadOwnImage(file('image/png'))).resolves.toEqual({
			error: m.ownImageErrors.uploadFailed
		});
		expect(bucket.upload).not.toHaveBeenCalled();
	});

	it('removes a file from the images bucket by its path', async () => {
		await removeOwnImage('user-id/old.png');

		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(bucket.remove).toHaveBeenCalledWith(['user-id/old.png', 'user-id/old-thumb.jpg']);
	});
});

describe('ownImageUrl', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
	});

	it('signs the uploaded file for an hour', async () => {
		bucket.createSignedUrl.mockResolvedValue({
			data: { signedUrl: 'https://storage.example.com/signed/old.png' },
			error: null
		});

		await expect(ownImageUrl('user-id/old.png')).resolves.toBe(
			'https://storage.example.com/signed/old.png'
		);
		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		expect(bucket.createSignedUrl).toHaveBeenCalledWith('user-id/old.png', SIGNED_URL_SECONDS);
	});

	it('returns nothing when the file cannot be signed', async () => {
		bucket.createSignedUrl.mockResolvedValue({ data: null, error: new Error('Object not found') });

		await expect(ownImageUrl('user-id/missing.png')).resolves.toBeUndefined();
	});
});
