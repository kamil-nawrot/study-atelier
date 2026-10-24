import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { favouriteLabel, favouriteToast, setFavourite } from './favourite.ts';

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

	it('clears the marker', async () => {
		await setFavourite('artwork-1', false);
		expect(query.update).toHaveBeenCalledWith({ favourite: false });
	});

	it('returns the message to show when the update fails', async () => {
		query.eq.mockResolvedValue({ error: { message: 'TypeError: Failed to fetch' } });
		await expect(setFavourite('artwork-1', true)).resolves.toEqual({ error: m.favourite.failed });
	});

	it('names the action by the current state', () => {
		expect(favouriteLabel(false)).toBe('Dodaj do ulubionych');
		expect(favouriteLabel(true)).toBe('Usuń z ulubionych');
		expect(favouriteToast(true)).toBe('Dodano do ulubionych.');
		expect(favouriteToast(false)).toBe('Usunięto z ulubionych.');
	});
});
