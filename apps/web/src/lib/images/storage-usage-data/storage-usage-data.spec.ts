import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadStorageUsage, quotaMessage } from './storage-usage-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn() }
}));

const rpc = vi.mocked(supabase.rpc);

function usage(used: number, quota: number): void {
	rpc.mockReturnValue({
		single: vi
			.fn()
			.mockResolvedValue({ data: { used_bytes: used, quota_bytes: quota }, error: null })
	} as never);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('loadStorageUsage', () => {
	it('reads the used space and the quota of the learner', async () => {
		usage(9_122_611, 209_715_200);

		await expect(loadStorageUsage()).resolves.toEqual({
			usedBytes: 9_122_611,
			quotaBytes: 209_715_200
		});
		expect(rpc).toHaveBeenCalledWith('storage_usage');
	});

	it('gives nothing when the usage cannot be read', async () => {
		rpc.mockReturnValue({
			single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } })
		} as never);

		await expect(loadStorageUsage()).resolves.toBeUndefined();
	});
});

describe('quotaMessage', () => {
	it('says the file does not fit when a refused upload would pass the quota', async () => {
		usage(209_000_000, 209_715_200);

		await expect(quotaMessage({ statusCode: '403' }, 1_000_000)).resolves.toBe(
			m.ownImageErrors.quotaFull('200')
		);
	});

	it('leaves a refusal that is not about the quota to the other messages', async () => {
		usage(1_000, 209_715_200);

		await expect(quotaMessage({ statusCode: '403' }, 1_000_000)).resolves.toBeUndefined();
	});

	it('does not ask about the space for an error that is not a refusal', async () => {
		await expect(quotaMessage({ statusCode: '413' }, 1_000_000)).resolves.toBeUndefined();
		expect(rpc).not.toHaveBeenCalled();
	});
});
