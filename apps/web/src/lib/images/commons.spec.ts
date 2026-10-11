import { afterEach, describe, expect, it, vi } from 'vitest';
import { commonsFileUrl, commonsSrcset, fetchCommonsSizes } from './commons.ts';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

describe('commons image urls', () => {
	it('builds a thumbnail url for an encoded file name', () => {
		expect(commonsFileUrl('Starry Night.jpg', 500)).toBe(
			'https://commons.wikimedia.org/wiki/Special:FilePath/Starry%20Night.jpg?width=500'
		);
	});

	it('lists every width in the srcset', () => {
		expect(commonsSrcset('a.jpg', [330, 500])).toBe(
			`${commonsFileUrl('a.jpg', 330)} 330w, ${commonsFileUrl('a.jpg', 500)} 500w`
		);
	});
});

describe('fetchCommonsSizes', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('reads the size of each file, following normalized titles', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			jsonResponse({
				query: {
					normalized: [{ from: 'File:Starry_Night.jpg', to: 'File:Starry Night.jpg' }],
					pages: [
						{ title: 'File:Starry Night.jpg', imageinfo: [{ width: 1200, height: 950 }] },
						{ title: 'File:Missing.jpg' }
					]
				}
			})
		);

		const sizes = await fetchCommonsSizes(['Starry_Night.jpg', 'Missing.jpg', 'Starry_Night.jpg']);

		expect(sizes).toEqual(new Map([['Starry_Night.jpg', { width: 1200, height: 950 }]]));
		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0];
		const params = new URL(String(url)).searchParams;
		expect(params.get('titles')).toBe('File:Starry_Night.jpg|File:Missing.jpg');
		expect(params.get('origin')).toBe('*');
		expect(init?.headers).toMatchObject({
			'Api-User-Agent': expect.stringContaining('study-atelier')
		});
	});

	it('remembers sizes for the rest of the session', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () =>
			jsonResponse({
				query: { pages: [{ title: 'File:Remembered.jpg', imageinfo: [{ width: 4, height: 3 }] }] }
			})
		);

		await fetchCommonsSizes(['Remembered.jpg']);
		const sizes = await fetchCommonsSizes(['Remembered.jpg']);

		expect(sizes.get('Remembered.jpg')).toEqual({ width: 4, height: 3 });
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('asks for at most fifty files at once', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => jsonResponse({ query: { pages: [] } }));

		await fetchCommonsSizes(Array.from({ length: 51 }, (_, index) => `batch-${index}.jpg`));

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('retries once after the time the service asks for', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValueOnce(
			new Response('', { status: 429, headers: { 'Retry-After': '2' } })
		);
		fetchMock.mockResolvedValueOnce(
			jsonResponse({
				query: { pages: [{ title: 'File:Retried.jpg', imageinfo: [{ width: 2, height: 1 }] }] }
			})
		);

		const result = fetchCommonsSizes(['Retried.jpg']);
		await vi.advanceTimersByTimeAsync(1999);
		expect(fetchMock).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(1);

		await expect(result).resolves.toEqual(new Map([['Retried.jpg', { width: 2, height: 1 }]]));
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns no sizes and asks again later when the service keeps failing', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = fetchCommonsSizes(['Failing.jpg']);
		await vi.runAllTimersAsync();

		await expect(result).resolves.toEqual(new Map());
		expect(fetchMock).toHaveBeenCalledTimes(2);

		fetchMock.mockResolvedValue(
			jsonResponse({
				query: { pages: [{ title: 'File:Failing.jpg', imageinfo: [{ width: 1, height: 1 }] }] }
			})
		);
		await expect(fetchCommonsSizes(['Failing.jpg'])).resolves.toEqual(
			new Map([['Failing.jpg', { width: 1, height: 1 }]])
		);
	});

	it('does not call the service without files', async () => {
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchCommonsSizes([])).resolves.toEqual(new Map());
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
