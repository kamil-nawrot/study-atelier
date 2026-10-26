import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { LEGAL_VERSION } from '#lib/legal/version/version.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { acceptLegal, loadAcceptedLegalVersion } from './legal-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadAcceptedLegalVersion', () => {
	it('reads the version the learner accepted', async () => {
		const maybeSingle = vi
			.fn()
			.mockResolvedValue({ data: { legal_version: '2026-10-26' }, error: null });
		from.mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) } as never);

		await expect(loadAcceptedLegalVersion()).resolves.toBe('2026-10-26');
		expect(from).toHaveBeenCalledWith('profiles');
	});

	it('gives null for a learner without a profile and nothing when the read fails', async () => {
		const maybeSingle = vi
			.fn()
			.mockResolvedValueOnce({ data: null, error: null })
			.mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } });
		from.mockReturnValue({ select: vi.fn().mockReturnValue({ maybeSingle }) } as never);

		await expect(loadAcceptedLegalVersion()).resolves.toBeNull();
		await expect(loadAcceptedLegalVersion()).resolves.toBeUndefined();
	});
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
