import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { saveEraBounds } from './era-bounds-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

function upsertResolving(error: unknown): ReturnType<typeof vi.fn> {
	const upsert = vi.fn().mockResolvedValue({ error });
	from.mockReturnValue({ upsert } as never);
	return upsert;
}

describe('saveEraBounds', () => {
	beforeEach(() => vi.clearAllMocks());

	it('saves the learner junctions on the profile', async () => {
		const upsert = upsertResolving(null);

		await expect(saveEraBounds([-3000, 476, 1560, 1789, 1945])).resolves.toEqual({});

		expect(from).toHaveBeenCalledWith('profiles');
		expect(upsert).toHaveBeenCalledWith({ era_bounds: [-3000, 476, 1560, 1789, 1945] });
	});

	it('clears the bounds when they are back at the defaults', async () => {
		const upsert = upsertResolving(null);

		await saveEraBounds([-3000, 476, 1492, 1789, 1945]);

		expect(upsert).toHaveBeenCalledWith({ era_bounds: null });
	});

	it('reports a failed save', async () => {
		upsertResolving({ message: 'Failed to fetch' });

		const result = await saveEraBounds([-3000, 476, 1560, 1789, 1945]);

		expect(result.error).toEqual(expect.any(String));
	});
});
