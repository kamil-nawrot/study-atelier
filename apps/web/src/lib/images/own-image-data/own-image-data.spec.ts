import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageApiError } from '@supabase/supabase-js';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_MAX_MEGABYTES,
	SIGNED_URL_SECONDS
} from '#lib/images/bucket/bucket.ts';
import {
	ownImageUrl,
	removeAllOwnFiles,
	removeOwnImage,
	uploadOwnImage
} from './own-image-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn() }, storage: { from: vi.fn() } }
}));

const bucket = { upload: vi.fn(), remove: vi.fn(), createSignedUrl: vi.fn() };

function file(type: string, size = 100, name = 'photo'): File {
	return new File([new Uint8Array(size)], name, { type });
}

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
}

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

describe('removeAllOwnFiles', () => {
	type Bucket = { list: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };

	function bucketWith(pages: { name: string; id: string | null }[][]): Bucket {
		const list = vi.fn();
		for (const page of pages) list.mockResolvedValueOnce({ data: page, error: null });
		const remove = vi.fn().mockResolvedValue({ data: [], error: null });
		vi.mocked(supabase.storage.from).mockReturnValue({ list, remove } as never);
		return { list, remove };
	}

	it('removes every file of the learner folder, page after page', async () => {
		const full = Array.from({ length: 1000 }, (_, index) => ({
			name: `${index}.jpg`,
			id: `id-${index}`
		}));
		const bucket = bucketWith([full, [{ name: 'last.jpg', id: 'id-last' }]]);

		await expect(removeAllOwnFiles('learner-1')).resolves.toBe(true);

		expect(bucket.list).toHaveBeenCalledWith('learner-1', { limit: 1000 });
		expect(bucket.remove).toHaveBeenCalledTimes(2);
		expect(bucket.remove.mock.calls[1][0]).toEqual(['learner-1/last.jpg']);
	});

	it('leaves folders to the database check and stops when nothing is left', async () => {
		const bucket = bucketWith([[{ name: 'nested', id: null }]]);

		await expect(removeAllOwnFiles('learner-1')).resolves.toBe(true);
		expect(bucket.remove).not.toHaveBeenCalled();
	});

	it('reports a failed listing', async () => {
		const list = vi.fn().mockResolvedValue({ data: null, error: { message: 'down' } });
		vi.mocked(supabase.storage.from).mockReturnValue({ list } as never);

		await expect(removeAllOwnFiles('learner-1')).resolves.toBe(false);
	});
});
