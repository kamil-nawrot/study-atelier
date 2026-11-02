import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { cached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { setFavourite } from './favourite-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const query = { update: vi.fn(), eq: vi.fn() };

describe('favourite', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.update.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
	});

	it('sets only the favourite column of the artwork', async () => {
		await expect(setFavourite('artwork-1', true)).resolves.toEqual({});
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.update).toHaveBeenCalledWith({ favourite: true });
		expect(query.eq).toHaveBeenCalledWith('id', 'artwork-1');
	});

	it('forgets the cached collection and keeps the card index', async () => {
		const atelier = vi.fn().mockResolvedValue({ artworks: [] });
		const cardIndex = vi.fn().mockResolvedValue({ index: {} });
		await cached('atelier', atelier);
		await cached('card-index', cardIndex);

		await setFavourite('artwork-1', true);
		await cached('atelier', atelier);
		await cached('card-index', cardIndex);

		expect(atelier).toHaveBeenCalledTimes(2);
		expect(cardIndex).toHaveBeenCalledTimes(1);
	});

	it('clears the marker', async () => {
		await setFavourite('artwork-1', false);
		expect(query.update).toHaveBeenCalledWith({ favourite: false });
	});

	it('returns the message to show when the update fails', async () => {
		query.eq.mockResolvedValue({ error: { message: 'TypeError: Failed to fetch' } });
		await expect(setFavourite('artwork-1', true)).resolves.toEqual({ error: m.favourite.failed });
	});
});
