import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageApiError } from '@supabase/supabase-js';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testSession } from '#lib/testing/auth.ts';
import { IMAGES_BUCKET, OWN_IMAGE_MAX_BYTES, OWN_IMAGE_MAX_MEGABYTES } from './bucket.ts';
import {
	ownImageFileError,
	ownImagePath,
	parseImageUrl,
	readImageSize,
	removeOwnImage,
	uploadOwnImage
} from './own-image.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn() }, storage: { from: vi.fn() } }
}));

const bucket = { upload: vi.fn(), remove: vi.fn() };

function file(type: string, size = 100, name = 'photo'): File {
	return new File([new Uint8Array(size)], name, { type });
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

	it('names the size limit for a file over it', () => {
		expect(ownImageFileError(file('image/jpeg', OWN_IMAGE_MAX_BYTES))).toBeUndefined();
		expect(ownImageFileError(file('image/jpeg', OWN_IMAGE_MAX_BYTES + 1))).toBe(
			m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES)
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
		expect(bucket.remove).toHaveBeenCalledWith(['user-id/old.png']);
	});
});
