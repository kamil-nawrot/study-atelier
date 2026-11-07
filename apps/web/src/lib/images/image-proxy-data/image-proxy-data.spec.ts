import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchImageThroughProxy } from './image-proxy-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { getSession: vi.fn() } }
}));

const SOURCE = 'https://images.example.test/a b.jpg';

function signedIn(token: string | undefined): void {
	vi.mocked(supabase.auth.getSession).mockResolvedValue({
		data: { session: token ? { access_token: token } : null }
	} as never);
}

describe('fetchImageThroughProxy', () => {
	beforeEach(() => {
		vi.mocked(supabase.auth.getSession).mockReset();
	});

	it('asks the proxy for the image with the session token', async () => {
		signedIn('tok');
		const blob = new Blob(['x']);
		const fetchSpy = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
		vi.stubGlobal('fetch', fetchSpy);

		expect(await fetchImageThroughProxy(SOURCE)).toBe(blob);
		expect(fetchSpy).toHaveBeenCalledWith(`/api/image-proxy?url=${encodeURIComponent(SOURCE)}`, {
			headers: { authorization: 'Bearer tok' }
		});
	});

	it('returns nothing without a session', async () => {
		signedIn(undefined);
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);

		expect(await fetchImageThroughProxy(SOURCE)).toBeUndefined();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns nothing when the proxy refuses or fails', async () => {
		signedIn('tok');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
		expect(await fetchImageThroughProxy(SOURCE)).toBeUndefined();

		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
		expect(await fetchImageThroughProxy(SOURCE)).toBeUndefined();
	});
});
