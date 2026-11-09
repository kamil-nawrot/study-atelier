import { describe, expect, it, vi } from 'vitest';
import { IMAGE_PROXY_MAX_BYTES, fetchPublicImage } from './image-proxy.ts';

const URL_OK = 'https://images.example.test/a.jpg';

function reply(body: BodyInit | null, init: ResponseInit = {}): Response {
	return new Response(body, { headers: { 'content-type': 'image/jpeg' }, ...init });
}

async function read(stream: ReadableStream<Uint8Array>): Promise<number> {
	let size = 0;
	for await (const chunk of stream) size += chunk.byteLength;
	return size;
}

describe('fetchPublicImage', () => {
	it('streams an image of a public host', async () => {
		const fetcher = vi.fn().mockResolvedValue(reply(new Uint8Array(10)));

		const result = await fetchPublicImage(URL_OK, fetcher);

		expect(result.ok && result.contentType).toBe('image/jpeg');
		expect(result.ok && (await read(result.body))).toBe(10);
		expect(fetcher).toHaveBeenCalledWith(
			URL_OK,
			expect.objectContaining({ redirect: 'manual', method: 'GET' })
		);
	});

	it('refuses an address that is not a public https one without fetching', async () => {
		const fetcher = vi.fn();

		expect(await fetchPublicImage('http://images.example.test/a.jpg', fetcher)).toEqual({
			ok: false,
			status: 400
		});
		expect(await fetchPublicImage(null, fetcher)).toEqual({ ok: false, status: 400 });
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('follows a redirect to a public host', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/b.jpg' } }))
			.mockResolvedValueOnce(reply(new Uint8Array(1)));

		const result = await fetchPublicImage(URL_OK, fetcher);

		expect(result.ok).toBe(true);
		expect(fetcher).toHaveBeenLastCalledWith(
			'https://images.example.test/b.jpg',
			expect.anything()
		);
	});

	it('gives the whole chain of redirects one deadline and drops the body of each redirect', async () => {
		const cancelled: string[] = [];
		const redirect = (location: string): Response =>
			new Response(
				new ReadableStream({
					cancel: () => {
						cancelled.push(location);
					}
				}),
				{ status: 302, headers: { location } }
			);
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(redirect('/b.jpg'))
			.mockResolvedValueOnce(redirect('/c.jpg'))
			.mockResolvedValueOnce(reply(new Uint8Array(1)));

		const result = await fetchPublicImage(URL_OK, fetcher);

		expect(result.ok).toBe(true);
		const signals = fetcher.mock.calls.map(([, init]) => (init as RequestInit).signal);
		expect(signals[0]).toBeInstanceOf(AbortSignal);
		expect(new Set(signals).size).toBe(1);
		await vi.waitFor(() => expect(cancelled).toEqual(['/b.jpg', '/c.jpg']));
	});

	it('drops the body of a response that is not an image', async () => {
		const cancel = vi.fn();
		const fetcher = vi.fn().mockResolvedValue(
			new Response(new ReadableStream({ cancel }), {
				headers: { 'content-type': 'text/html' }
			})
		);

		expect(await fetchPublicImage(URL_OK, fetcher)).toEqual({ ok: false, status: 415 });
		await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
	});

	it('refuses a redirect to an internal address', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValue(
				new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/a.jpg' } })
			);

		expect(await fetchPublicImage(URL_OK, fetcher)).toEqual({ ok: false, status: 502 });
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('refuses a redirect to an address that cannot be read', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValue(
				new Response(null, { status: 302, headers: { location: 'https://exa mple.test/%' } })
			);

		expect(await fetchPublicImage(URL_OK, fetcher)).toEqual({ ok: false, status: 502 });
	});

	it('refuses a redirect without a location and an endless chain of redirects', async () => {
		const bare = vi.fn().mockResolvedValue(new Response(null, { status: 302 }));
		const endless = vi.fn().mockImplementation(() =>
			Promise.resolve(
				new Response(null, {
					status: 302,
					headers: { location: 'https://images.example.test/n' }
				})
			)
		);

		expect(await fetchPublicImage(URL_OK, bare)).toEqual({ ok: false, status: 502 });
		expect(await fetchPublicImage(URL_OK, endless)).toEqual({ ok: false, status: 502 });
		expect(endless).toHaveBeenCalledTimes(4);
	});

	it('refuses what is not an image, including SVG', async () => {
		const html = vi
			.fn()
			.mockResolvedValue(new Response('<p>', { headers: { 'content-type': 'text/html' } }));
		const svg = vi
			.fn()
			.mockResolvedValue(new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }));
		const none = vi.fn().mockResolvedValue(new Response('x'));

		expect(await fetchPublicImage(URL_OK, html)).toEqual({ ok: false, status: 415 });
		expect(await fetchPublicImage(URL_OK, svg)).toEqual({ ok: false, status: 415 });
		expect(await fetchPublicImage(URL_OK, none)).toEqual({ ok: false, status: 415 });
	});

	it('refuses a host error, an empty body and a failed connection', async () => {
		const refused = vi.fn().mockResolvedValue(new Response('no', { status: 403 }));
		const empty = vi.fn().mockResolvedValue(reply(null));
		const down = vi.fn().mockRejectedValue(new Error('down'));

		expect(await fetchPublicImage(URL_OK, refused)).toEqual({ ok: false, status: 502 });
		expect(await fetchPublicImage(URL_OK, empty)).toEqual({ ok: false, status: 502 });
		expect(await fetchPublicImage(URL_OK, down)).toEqual({ ok: false, status: 502 });
	});

	it('refuses an image that declares a size over the limit', async () => {
		const fetcher = vi.fn().mockResolvedValue(
			reply(new Uint8Array(1), {
				headers: {
					'content-type': 'image/png',
					'content-length': String(IMAGE_PROXY_MAX_BYTES + 1)
				}
			})
		);

		expect(await fetchPublicImage(URL_OK, fetcher)).toEqual({ ok: false, status: 413 });
	});

	it('stops streaming an image that grows over the limit', async () => {
		const chunk = new Uint8Array(IMAGE_PROXY_MAX_BYTES / 2 + 1);
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(chunk);
				controller.enqueue(chunk);
				controller.close();
			}
		});
		const fetcher = vi.fn().mockResolvedValue(reply(body));

		const result = await fetchPublicImage(URL_OK, fetcher);

		expect(result.ok).toBe(true);
		await expect(result.ok ? read(result.body) : Promise.resolve(0)).rejects.toThrow('too large');
	});
});
