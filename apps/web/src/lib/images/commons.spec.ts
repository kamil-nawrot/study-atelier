import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	commonsFileUrl,
	commonsSrcset,
	commonsThumbnailSrcset,
	fetchCommonsImages
} from './commons.ts';

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

const THUMB =
	'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Starry_Night.jpg/500px-Starry_Night.jpg';

function info(width: number, height: number, thumburl = THUMB): Record<string, unknown> {
	return { width, height, thumburl };
}

describe('commonsThumbnailSrcset', () => {
	it('lists the thumbnail widths up to the original width', () => {
		expect(
			commonsThumbnailSrcset({ width: 600, height: 400, thumbnailUrl: THUMB }, 500, [330, 500, 960])
		).toBe(`${THUMB.replace('/500px-', '/330px-')} 330w, ${THUMB} 500w`);
	});

	it('has no srcset when the image is smaller than the thumbnail', () => {
		expect(
			commonsThumbnailSrcset(
				{ width: 300, height: 200, thumbnailUrl: 'https://upload.wikimedia.org/a/ab/Small.jpg' },
				500,
				[330, 500]
			)
		).toBeUndefined();
	});
});

describe('fetchCommonsImages', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('reads size and thumbnail of each file, following normalized titles', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			jsonResponse({
				query: {
					normalized: [{ from: 'File:Starry_Night.jpg', to: 'File:Starry Night.jpg' }],
					pages: [
						{ title: 'File:Starry Night.jpg', imageinfo: [info(1200, 950)] },
						{ title: 'File:Missing.jpg' }
					]
				}
			})
		);

		const images = await fetchCommonsImages(
			['Starry_Night.jpg', 'Missing.jpg', 'Starry_Night.jpg'],
			500
		);

		expect(images).toEqual(
			new Map([['Starry_Night.jpg', { width: 1200, height: 950, thumbnailUrl: THUMB }]])
		);
		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0];
		const params = new URL(String(url)).searchParams;
		expect(params.get('titles')).toBe('File:Starry_Night.jpg|File:Missing.jpg');
		expect(params.get('iiurlwidth')).toBe('500');
		expect(params.get('origin')).toBe('*');
		expect(init?.headers).toMatchObject({
			'Api-User-Agent': expect.stringContaining('study-atelier')
		});
	});

	it('asks for at most fifty files at once', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => jsonResponse({ query: { pages: [] } }));

		await fetchCommonsImages(
			Array.from({ length: 51 }, (_, index) => `${index}.jpg`),
			500
		);

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('retries once after the time the service asks for', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValueOnce(
			new Response('', { status: 429, headers: { 'Retry-After': '2' } })
		);
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ query: { pages: [{ title: 'File:Retried.jpg', imageinfo: [info(2, 1)] }] } })
		);

		const result = fetchCommonsImages(['Retried.jpg'], 500);
		await vi.advanceTimersByTimeAsync(1999);
		expect(fetchMock).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(1);

		await expect(result).resolves.toEqual(
			new Map([['Retried.jpg', { width: 2, height: 1, thumbnailUrl: THUMB }]])
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns no images when the service keeps failing', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = fetchCommonsImages(['Failing.jpg'], 500);
		await vi.runAllTimersAsync();

		await expect(result).resolves.toEqual(new Map());
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('does not call the service without files', async () => {
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchCommonsImages([], 500)).resolves.toEqual(new Map());
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
