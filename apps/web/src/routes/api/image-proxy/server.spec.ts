import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server.ts';

function call(headers: Record<string, string>, target?: string): Promise<Response> {
	const url = new URL('https://app.example.test/api/image-proxy');
	if (target) url.searchParams.set('url', target);
	return GET({ request: new Request(url, { headers }), url } as never) as Promise<Response>;
}

describe('GET /api/image-proxy', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('refuses a request without a valid session', async () => {
		const fetchSpy = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
		vi.stubGlobal('fetch', fetchSpy);

		expect((await call({}, 'https://images.example.test/a.jpg')).status).toBe(401);
		expect(
			(await call({ authorization: 'Bearer bad' }, 'https://images.example.test/a.jpg')).status
		).toBe(401);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it('refuses an address that is not public', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

		expect((await call({ authorization: 'Bearer ok' }, 'https://127.0.0.1/a.jpg')).status).toBe(
			400
		);
	});

	it('returns the image of a signed-in learner', async () => {
		vi.stubGlobal(
			'fetch',
			vi
				.fn()
				.mockImplementation((input: string) =>
					Promise.resolve(
						input.includes('/auth/v1/user')
							? new Response('{}', { status: 200 })
							: new Response(new Uint8Array(4), { headers: { 'content-type': 'image/png' } })
					)
				)
		);

		const response = await call(
			{ authorization: 'Bearer ok' },
			'https://images.example.test/a.png'
		);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/png');
		expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
		expect((await response.arrayBuffer()).byteLength).toBe(4);
	});
});
