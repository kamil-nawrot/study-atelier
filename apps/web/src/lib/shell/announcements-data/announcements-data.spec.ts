import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const from = vi.mocked(supabase.from);
const ANNOUNCEMENT = { id: 'a', title: null, body: 'Przerwa techniczna' };

function answer(result: { data: unknown; error: unknown }): void {
	from.mockReturnValue({
		select: () => ({ order: vi.fn().mockResolvedValue(result) })
	} as never);
}

async function freshModule(): Promise<typeof import('./announcements-data.ts')> {
	vi.resetModules();
	return import('./announcements-data.ts');
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('currentAnnouncements', () => {
	it('asks for the announcements once per page load', async () => {
		answer({ data: [ANNOUNCEMENT], error: null });
		const { currentAnnouncements } = await freshModule();

		await expect(currentAnnouncements()).resolves.toEqual([ANNOUNCEMENT]);
		await expect(currentAnnouncements()).resolves.toEqual([ANNOUNCEMENT]);
		expect(from).toHaveBeenCalledOnce();
	});

	it('shows nothing after a failure and asks again next time', async () => {
		answer({ data: null, error: { message: 'down' } });
		const { currentAnnouncements } = await freshModule();

		await expect(currentAnnouncements()).resolves.toEqual([]);
		answer({ data: [ANNOUNCEMENT], error: null });
		await expect(currentAnnouncements()).resolves.toEqual([ANNOUNCEMENT]);
		expect(from).toHaveBeenCalledTimes(2);
	});
});
