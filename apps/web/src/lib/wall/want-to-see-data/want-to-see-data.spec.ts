import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { cached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { setWantToSee } from './want-to-see-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const query = { update: vi.fn(), eq: vi.fn() };

describe('want to see', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.update.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
	});

	it('sets only the want-to-see column of the artwork', async () => {
		await expect(setWantToSee('artwork-1', true)).resolves.toEqual({});
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.update).toHaveBeenCalledWith({ want_to_see: true });
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
	});

	it('forgets the cached collection', async () => {
		const atelier = vi.fn().mockResolvedValue({ artworks: [] });
		await cached('atelier', atelier);
		await setWantToSee('artwork-1', false);
		await cached('atelier', atelier);
		expect(atelier).toHaveBeenCalledTimes(2);
		expect(query.update).toHaveBeenCalledWith({ want_to_see: false });
	});

	it('returns the message to show when the update fails', async () => {
		query.eq.mockResolvedValue({ error: { message: 'TypeError: Failed to fetch' } });
		await expect(setWantToSee('artwork-1', true)).resolves.toEqual({ error: m.favourite.failed });
	});
});
