import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backfillThumbnails } from './thumbnail-backfill.ts';
import { uploadOwnThumbnail } from '#lib/images/own-image-data/own-image-data.ts';

vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ uploadOwnThumbnail: vi.fn() }));

async function settle(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('backfillThumbnails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['x'])) })
		);
	});

	it('makes and uploads a small copy for every original, one after another, once per session', async () => {
		backfillThumbnails(
			new Map([
				['user-id/a.jpg', 'https://example.com/a'],
				['user-id/b.jpg', 'https://example.com/b']
			])
		);
		backfillThumbnails(new Map([['user-id/a.jpg', 'https://example.com/a']]));
		await settle();

		expect(uploadOwnThumbnail).toHaveBeenCalledTimes(2);
		expect(uploadOwnThumbnail).toHaveBeenNthCalledWith(1, 'user-id/a.jpg', expect.any(Blob));
		expect(uploadOwnThumbnail).toHaveBeenNthCalledWith(2, 'user-id/b.jpg', expect.any(Blob));
	});

	it('skips an original that could not be downloaded', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

		backfillThumbnails(new Map([['user-id/c.jpg', 'https://example.com/c']]));
		await settle();

		expect(uploadOwnThumbnail).not.toHaveBeenCalled();
	});
});
