import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { acceptLegal } from './legal-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('acceptLegal', () => {
	it('stores the current version as accepted', async () => {
		const upsert = vi.fn().mockResolvedValue({ error: null });
		from.mockReturnValue({ upsert } as never);

		await expect(acceptLegal()).resolves.toBeUndefined();
		expect(upsert).toHaveBeenCalledWith({ legal_version: LEGAL_VERSION });
	});

	it('says the acceptance was not saved', async () => {
		from.mockReturnValue({
			upsert: vi.fn().mockResolvedValue({ error: { code: '42501', message: 'denied' } })
		} as never);

		await expect(acceptLegal()).resolves.toBe(m.legal.acceptFailed);
	});
});
