import { describe, expect, it, vi } from 'vitest';
import { bearerToken, isSignedIn } from './image-proxy-auth.ts';

describe('bearerToken', () => {
	it('reads the token of an authorization header', () => {
		expect(bearerToken('Bearer abc.def')).toBe('abc.def');
		expect(bearerToken('bearer abc')).toBe('abc');
	});

	it('returns nothing for a missing or malformed header', () => {
		expect(bearerToken(null)).toBeUndefined();
		expect(bearerToken('Basic abc')).toBeUndefined();
		expect(bearerToken('Bearer')).toBeUndefined();
	});
});

describe('isSignedIn', () => {
	it('asks the auth service about the token', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

		expect(await isSignedIn('tok', 'https://x.supabase.test', 'key', fetcher)).toBe(true);
		expect(fetcher).toHaveBeenCalledWith('https://x.supabase.test/auth/v1/user', {
			headers: { apikey: 'key', authorization: 'Bearer tok' }
		});
	});

	it('refuses a token the service rejects, a missing token and an unreachable service', async () => {
		const rejected = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
		const down = vi.fn().mockRejectedValue(new Error('down'));

		expect(await isSignedIn('bad', 'https://x.supabase.test', 'key', rejected)).toBe(false);
		expect(await isSignedIn(undefined, 'https://x.supabase.test', 'key', rejected)).toBe(false);
		expect(rejected).toHaveBeenCalledTimes(1);
		expect(await isSignedIn('tok', 'https://x.supabase.test', 'key', down)).toBe(false);
	});
});
