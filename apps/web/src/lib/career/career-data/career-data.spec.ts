import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadPoints } from './career-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn() }
}));

const rpc = vi.mocked(supabase.rpc);

describe('career data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the points of the learner', async () => {
		rpc.mockResolvedValue({ data: 1846, error: null } as never);
		await expect(loadPoints()).resolves.toEqual({ points: 1846 });
		expect(rpc).toHaveBeenCalledWith('learner_points');
	});

	it('returns no points and a message when the points fail', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(loadPoints()).resolves.toEqual({ points: 0, error: m.collectionErrors.network });
	});
});
