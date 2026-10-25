import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson, WikimediaError } from './wikimedia.ts';

const fetchMock = vi.fn<typeof fetch>();

describe('fetchJson', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('names the app and the repository and no person', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('{"ok":true}'));

		await expect(fetchJson('https://example.org/api')).resolves.toEqual({ ok: true });
		const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
		expect(headers['Api-User-Agent']).toBe(
			'study-atelier (https://github.com/kamil-nawrot/study-atelier)'
		);
	});

	it('waits at most five seconds before the one retry', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValueOnce(
			new Response('', { status: 429, headers: { 'Retry-After': '30' } })
		);
		fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }));

		const result = fetchJson('https://example.org/api');
		const failure = expect(result).rejects.toEqual(new WikimediaError(429));
		await vi.advanceTimersByTimeAsync(4999);
		expect(fetchMock).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(1);

		await failure;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('gives up after thirty seconds without an answer and does not retry', async () => {
		vi.stubGlobal('fetch', fetchMock);
		const timeout = vi
			.spyOn(AbortSignal, 'timeout')
			.mockReturnValue(AbortSignal.abort(new DOMException('No answer', 'TimeoutError')));
		fetchMock.mockImplementation((_url, init) => Promise.reject(init?.signal?.reason));

		await expect(fetchJson('https://example.org/api')).rejects.toEqual(new WikimediaError(504));
		expect(timeout).toHaveBeenCalledWith(30000);
		expect(fetchMock).toHaveBeenCalledOnce();
		timeout.mockRestore();
	});

	it('fails without a status when the network is down twice', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = fetchJson('https://example.org/api');
		const failure = expect(result).rejects.toEqual(new WikimediaError(null));
		await vi.runAllTimersAsync();

		await failure;
	});
});
