import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	commonsFilePage,
	commonsFileUrl,
	commonsSrcset,
	commonsThumbnailSrcset,
	fetchCommonsFiles,
	fetchCommonsThumbnails,
	plainText
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

function info(thumburl = THUMB): Record<string, unknown> {
	return { thumburl };
}

describe('commonsThumbnailSrcset', () => {
	it('lists the given widths built from the thumbnail url', () => {
		expect(commonsThumbnailSrcset(THUMB, 500, [330, 500])).toBe(
			`${THUMB.replace('/500px-', '/330px-')} 330w, ${THUMB} 500w`
		);
	});

	it('keeps the host and the query of a thumbnail url from thumb.wikimedia.org', () => {
		const thumbnail =
			'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa.jpg/500px-Mona_Lisa.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';

		expect(commonsThumbnailSrcset(thumbnail, 500, [330, 960])).toBe(
			`${thumbnail.replace('/500px-', '/330px-')} 330w, ${thumbnail.replace('/500px-', '/960px-')} 960w`
		);
	});

	it('has no srcset when the image is smaller than the thumbnail', () => {
		expect(
			commonsThumbnailSrcset('https://upload.wikimedia.org/a/ab/Small.jpg', 500, [330, 500])
		).toBeUndefined();
	});
});

describe('fetchCommonsThumbnails', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('reads the thumbnail of each file, following normalized titles', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			jsonResponse({
				query: {
					normalized: [{ from: 'File:Starry_Night.jpg', to: 'File:Starry Night.jpg' }],
					pages: [
						{ title: 'File:Starry Night.jpg', imageinfo: [info()] },
						{ title: 'File:Missing.jpg' }
					]
				}
			})
		);

		const images = await fetchCommonsThumbnails(
			['Starry_Night.jpg', 'Missing.jpg', 'Starry_Night.jpg'],
			500
		);

		expect(images).toEqual(new Map([['Starry_Night.jpg', THUMB]]));
		expect(fetchMock).toHaveBeenCalledOnce();
		const [url, init] = fetchMock.mock.calls[0];
		const params = new URL(String(url)).searchParams;
		expect(params.get('titles')).toBe('File:Starry_Night.jpg|File:Missing.jpg');
		expect(params.get('iiprop')).toBe('url');
		expect(params.get('iiurlwidth')).toBe('500');
		expect(params.get('origin')).toBe('*');
		expect(params.get('maxage')).toBe('86400');
		expect(params.get('smaxage')).toBe('86400');
		expect(init?.headers).toMatchObject({
			'Api-User-Agent': expect.stringContaining('study-atelier')
		});
	});

	it('asks for at most fifty files at once', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => jsonResponse({ query: { pages: [] } }));

		await fetchCommonsThumbnails(
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
			jsonResponse({ query: { pages: [{ title: 'File:Retried.jpg', imageinfo: [info()] }] } })
		);

		const result = fetchCommonsThumbnails(['Retried.jpg'], 500);
		await vi.advanceTimersByTimeAsync(1999);
		expect(fetchMock).toHaveBeenCalledOnce();
		await vi.advanceTimersByTimeAsync(1);

		await expect(result).resolves.toEqual(new Map([['Retried.jpg', THUMB]]));
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns no images when the service keeps failing', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = fetchCommonsThumbnails(['Failing.jpg'], 500);
		await vi.runAllTimersAsync();

		await expect(result).resolves.toEqual(new Map());
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('does not call the service without files', async () => {
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchCommonsThumbnails([], 500)).resolves.toEqual(new Map());
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('plainText', () => {
	it('drops tags, decodes entities and collapses spaces', () => {
		expect(
			plainText('<a href="x">Jane&nbsp;Doe</a>\n &amp; <b>J&#246;rg</b> &#x2014; &unknown;')
		).toBe('Jane Doe & Jörg — &unknown;');
	});
});

describe('fetchCommonsFiles', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		fetchMock.mockReset();
	});

	it('reads the thumbnail, the original size, the licence and the photographer', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(
			jsonResponse({
				query: {
					pages: [
						{
							title: 'File:David.jpg',
							imageinfo: [
								{
									thumburl: THUMB,
									width: 3000,
									height: 4000,
									extmetadata: {
										LicenseShortName: { value: 'CC BY-SA 4.0' },
										LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' },
										Artist: { value: '<span>Jane Doe</span>' }
									}
								}
							]
						},
						{ title: 'File:No size.jpg', imageinfo: [{ thumburl: THUMB }] }
					]
				}
			})
		);

		const files = await fetchCommonsFiles(['David.jpg', 'No size.jpg'], 330);

		expect(files).toEqual(
			new Map([
				[
					'David.jpg',
					{
						thumbnailUrl: THUMB,
						width: 3000,
						height: 4000,
						licence: 'CC BY-SA 4.0',
						licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
						attribution: 'Jane Doe'
					}
				]
			])
		);
		const params = new URL(String(fetchMock.mock.calls[0][0])).searchParams;
		expect(params.get('iiprop')).toBe('url|size|extmetadata');
		expect(params.get('iiextmetadatafilter')).toBe('LicenseShortName|LicenseUrl|Artist');
	});

	it('fails when Commons does not answer', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));

		await expect(fetchCommonsFiles(['David.jpg'], 330)).rejects.toThrow();
	});

	it('does not call the service without files', async () => {
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchCommonsFiles([], 330)).resolves.toEqual(new Map());
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('commons file page', () => {
	it('links to the description page of a file', () => {
		expect(commonsFilePage('Albrecht Dürer, Melencolia I, 1514.jpg')).toBe(
			'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer%2C_Melencolia_I%2C_1514.jpg'
		);
	});
});
