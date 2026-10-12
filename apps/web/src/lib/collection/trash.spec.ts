import { beforeEach, describe, expect, it, vi } from 'vitest';
import { removeOwnImage } from '#lib/images/own-image.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { deletePermanently, moveToTrash, restoreArtwork } from './trash.ts';

vi.mock('#lib/images/own-image.ts', () => ({ removeOwnImage: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn() } }));

const query = {
	update: vi.fn(),
	delete: vi.fn(),
	eq: vi.fn()
};

describe('trash actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
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
			error: m.artworkErrors.network
		});
	});

	it('deletes an artwork permanently together with its uploaded image', async () => {
		await expect(deletePermanently('artwork-1', 'owner/image.jpg')).resolves.toEqual({});
		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
		expect(removeOwnImage).toHaveBeenCalledWith('owner/image.jpg');
	});

	it('deletes an artwork without an uploaded image without touching storage', async () => {
		await expect(deletePermanently('artwork-1', null)).resolves.toEqual({});
		expect(removeOwnImage).not.toHaveBeenCalled();
	});

	it('keeps the uploaded image when deleting the artwork fails', async () => {
		query.eq.mockResolvedValue({ error: { code: '42501', message: 'denied' } });

		await expect(deletePermanently('artwork-1', 'owner/image.jpg')).resolves.toEqual({
			error: m.common.unexpectedError
		});
		expect(removeOwnImage).not.toHaveBeenCalled();
	});
});
