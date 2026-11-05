import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { IMAGES_BUCKET } from '#lib/images/bucket/bucket.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import { pinCropPath, savePinCrop } from './pin-crop-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn() }, storage: { from: vi.fn() }, from: vi.fn() }
}));

const bucket = { upload: vi.fn() };
const query = { update: vi.fn(), eq: vi.fn() };

const pin: Pin = {
	id: 'pin-1',
	imageId: 'image-1',
	x: 0.4,
	y: 0.6,
	glossaryEntryId: null,
	text: '',
	viewWidth: 0.1
};

describe('savePinCrop', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.auth.getSession).mockResolvedValue({
			data: { session: testSession() },
			error: null
		});
		vi.mocked(supabase.storage.from).mockReturnValue(bucket as never);
		vi.mocked(supabase.from).mockReturnValue(query as never);
		bucket.upload.mockResolvedValue({ data: { path: 'ignored' }, error: null });
		query.update.mockReturnValue(query);
		query.eq.mockImplementation(() => Object.assign(Promise.resolve({ error: null }), query));
	});

	it('names the crop after the pin in the learner folder', () => {
		expect(pinCropPath('owner', 'pin-1')).toMatch(/^owner\/pin-1-crop-[0-9a-f]{8}\.jpg$/);
	});

	it('uploads the crop and stores its path on the pin while its view is unchanged', async () => {
		const crop = new Blob(['jpeg'], { type: 'image/jpeg' });

		await expect(savePinCrop(pin, crop)).resolves.toBe(true);

		const ownerId = testSession().user.id;
		expect(supabase.storage.from).toHaveBeenCalledWith(IMAGES_BUCKET);
		const [path, body, options] = bucket.upload.mock.calls[0];
		expect(path).toMatch(new RegExp(`^${ownerId}/pin-1-crop-`));
		expect(body).toBe(crop);
		expect(options).toMatchObject({ contentType: 'image/jpeg', upsert: false });
		expect(supabase.from).toHaveBeenCalledWith('artwork_pins');
		expect(query.update).toHaveBeenCalledWith({ crop_path: path });
		expect(query.eq.mock.calls).toEqual([
			['id', 'pin-1'],
			['x', 0.4],
			['y', 0.6],
			['view_width', 0.1]
		]);
	});

	it('stores nothing when the upload fails', async () => {
		bucket.upload.mockResolvedValue({ data: null, error: { message: 'quota' } });

		await expect(savePinCrop(pin, new Blob())).resolves.toBe(false);
		expect(query.update).not.toHaveBeenCalled();
	});

	it('stores nothing for a pin without a view', async () => {
		await expect(savePinCrop({ ...pin, viewWidth: undefined }, new Blob())).resolves.toBe(false);
		expect(bucket.upload).not.toHaveBeenCalled();
	});
});
