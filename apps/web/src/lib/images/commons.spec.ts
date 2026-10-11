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
		const url = new URL(String(fetchMock.mock.calls[0][0]));
		expect(url.searchParams.get('titles')).toBe('File:Starry_Night.jpg|File:Missing.jpg');
		expect(url.searchParams.get('origin')).toBe('*');
	});

	it('asks for at most fifty files at once', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockImplementation(async () => jsonResponse({ query: { pages: [] } }));

		await fetchCommonsSizes(Array.from({ length: 51 }, (_, index) => `${index}.jpg`));

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns no sizes when the service fails', async () => {
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockResolvedValueOnce(jsonResponse({}, 429));
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		await expect(
			fetchCommonsSizes(Array.from({ length: 51 }, (_, index) => `${index}.jpg`))
		).resolves.toEqual(new Map());
	});

	it('does not call the service without files', async () => {
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchCommonsSizes([])).resolves.toEqual(new Map());
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
