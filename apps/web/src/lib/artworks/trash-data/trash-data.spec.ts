import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { clearTrash, deletePermanently, moveToTrash, restoreArtwork } from './trash-data.ts';

vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ removeOwnImage: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = {
	update: vi.fn(),
	delete: vi.fn(),
	eq: vi.fn()
};

const images = {
	select: vi.fn(),
	eq: vi.fn()
};

describe('trash actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockImplementation(
			(table: string) => (table === 'artwork_images' ? images : query) as never
		);
		images.select.mockReturnValue(images);
		images.eq.mockResolvedValue({ data: [], error: null });
		query.update.mockReturnValue(query);
		query.delete.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
	});

	it('moves an artwork to the trash with the time it was deleted', async () => {
		await expect(moveToTrash('artwork-1', new Date('2026-10-12T14:00:00Z'))).resolves.toEqual({});
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.update).toHaveBeenCalledWith({ deleted_at: '2026-10-12T14:00:00.000Z' });
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
	});

	it('restores an artwork by clearing the time it was deleted', async () => {
		await expect(restoreArtwork('artwork-1')).resolves.toEqual({});
		expect(query.update).toHaveBeenCalledWith({ deleted_at: null });
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
	});

	it('returns a mapped message when an update fails', async () => {
		query.eq.mockResolvedValue({ error: { message: 'TypeError: Failed to fetch' } });

		await expect(restoreArtwork('artwork-1')).resolves.toEqual({
			error: m.common.network
		});
	});

	it('deletes an artwork permanently together with the uploaded files of its images', async () => {
		images.eq.mockResolvedValue({
			data: [{ own_image_path: 'owner/image.jpg' }, { own_image_path: 'owner/plan.jpg' }],
			error: null
		});

		await expect(deletePermanently('artwork-1')).resolves.toEqual({});
		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
		expect(images.eq).toHaveBeenCalledWith('artwork_id', 'artwork-1');
		expect(removeOwnImage).toHaveBeenCalledWith('owner/image.jpg');
		expect(removeOwnImage).toHaveBeenCalledWith('owner/plan.jpg');
		expect(removeOwnImage).toHaveBeenCalledTimes(2);
	});

	it('deletes an artwork without an uploaded image without touching storage', async () => {
		images.eq.mockResolvedValue({ data: [{ own_image_path: null }], error: null });

		await expect(deletePermanently('artwork-1')).resolves.toEqual({});
		expect(removeOwnImage).not.toHaveBeenCalled();
	});

	it('keeps the uploaded image when deleting the artwork fails', async () => {
		images.eq.mockResolvedValue({ data: [{ own_image_path: 'owner/image.jpg' }], error: null });
		query.eq.mockResolvedValue({ error: { code: '42501', message: 'denied' } });

		await expect(deletePermanently('artwork-1')).resolves.toEqual({
			error: m.common.unexpectedError
		});
		expect(removeOwnImage).not.toHaveBeenCalled();
	});
});

describe('clearing the trash', () => {
	const read = { select: vi.fn(), not: vi.fn() };
	const remove = { delete: vi.fn(), not: vi.fn(), select: vi.fn() };

	beforeEach(() => {
		vi.clearAllMocks();
		let call = 0;
		vi.mocked(supabase.from).mockImplementation(() => (call++ === 0 ? read : remove) as never);
		read.select.mockReturnValue(read);
		read.not.mockResolvedValue({
			data: [
				{ id: 'a', artwork_images: [{ own_image_path: 'owner/a.jpg' }, { own_image_path: null }] },
				{ id: 'b', artwork_images: [{ own_image_path: 'owner/b.jpg' }] }
			],
			error: null
		});
		remove.delete.mockReturnValue(remove);
		remove.not.mockReturnValue(remove);
		remove.select.mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }], error: null });
	});

	it('deletes every artwork in the trash and the uploaded files of their images', async () => {
		await expect(clearTrash()).resolves.toEqual({});
		expect(read.not).toHaveBeenCalledWith('deleted_at', 'is', null);
		expect(remove.not).toHaveBeenCalledWith('deleted_at', 'is', null);
		expect(removeOwnImage).toHaveBeenCalledWith('owner/a.jpg');
		expect(removeOwnImage).toHaveBeenCalledWith('owner/b.jpg');
		expect(removeOwnImage).toHaveBeenCalledTimes(2);
	});

	it('keeps the files of an artwork restored meanwhile', async () => {
		remove.select.mockResolvedValue({ data: [{ id: 'a' }], error: null });

		await expect(clearTrash()).resolves.toEqual({});
		expect(removeOwnImage).toHaveBeenCalledWith('owner/a.jpg');
		expect(removeOwnImage).toHaveBeenCalledTimes(1);
	});

	it('deletes nothing when the trash cannot be read', async () => {
		read.not.mockResolvedValue({ data: null, error: { message: 'TypeError: Failed to fetch' } });

		await expect(clearTrash()).resolves.toEqual({ error: m.common.network });
		expect(remove.delete).not.toHaveBeenCalled();
	});

	it('keeps the files when deleting the artworks fails', async () => {
		remove.select.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });

		await expect(clearTrash()).resolves.toEqual({ error: m.common.unexpectedError });
		expect(removeOwnImage).not.toHaveBeenCalled();
	});
});
