export type ImageSize = {
	width: number;
	height: number;
};

export const COMMONS_THUMBNAIL_WIDTHS = [250, 330, 500, 960, 1280, 1920] as const;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const TITLES_PER_REQUEST = 50;
const API_USER_AGENT = 'study-atelier (https://github.com/kamil-nawrot/study-atelier)';
const MAX_RETRY_SECONDS = 5;

const knownSizes = new Map<string, ImageSize | null>();

type ImageInfoResponse = {
	query?: {
		normalized?: { from: string; to: string }[];
		pages?: { title: string; imageinfo?: ImageSize[] }[];
	};
};

export function commonsFileUrl(file: string, width: number): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function commonsSrcset(file: string, widths: readonly number[]): string {
	return widths.map((width) => `${commonsFileUrl(file, width)} ${width}w`).join(', ');
}

function fileTitle(file: string): string {
	return `File:${file}`;
}

function retryDelaySeconds(response: Response | undefined): number {
	const seconds = Number(response?.headers.get('Retry-After'));
	return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAX_RETRY_SECONDS) : 1;
}

async function fetchWithRetry(url: string): Promise<Response> {
	const init = { headers: { 'Api-User-Agent': API_USER_AGENT } };
	const response = await fetch(url, init).catch(() => undefined);
	if (response && response.status !== 429) return response;
	await new Promise((resolve) => setTimeout(resolve, retryDelaySeconds(response) * 1000));
	return fetch(url, init);
}

async function fetchSizeBatch(files: string[]): Promise<Map<string, ImageSize>> {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		formatversion: '2',
		origin: '*',
		prop: 'imageinfo',
		iiprop: 'size',
		titles: files.map(fileTitle).join('|')
	});
	const response = await fetchWithRetry(`${COMMONS_API}?${params}`);
	if (!response.ok) throw new Error(`Commons API answered ${response.status}`);
	const { query }: ImageInfoResponse = await response.json();
	const sizesByTitle = new Map(
		(query?.pages ?? [])
			.filter((page) => page.imageinfo?.[0])
			.map((page) => {
				const [{ width, height }] = page.imageinfo as ImageSize[];
				return [page.title, { width, height }];
			})
	);
	const normalized = new Map((query?.normalized ?? []).map(({ from, to }) => [from, to]));
	const sizes = new Map<string, ImageSize>();
	for (const file of files) {
		const title = fileTitle(file);
		const size = sizesByTitle.get(normalized.get(title) ?? title);
		if (size) sizes.set(file, size);
	}
	return sizes;
}

export async function fetchCommonsSizes(files: string[]): Promise<Map<string, ImageSize>> {
	const missing = [...new Set(files)].filter((file) => !knownSizes.has(file));
	for (let start = 0; start < missing.length; start += TITLES_PER_REQUEST) {
		const batch = missing.slice(start, start + TITLES_PER_REQUEST);
		try {
			const sizes = await fetchSizeBatch(batch);
			batch.forEach((file) => knownSizes.set(file, sizes.get(file) ?? null));
		} catch {
			break;
		}
	}
	const sizes = new Map<string, ImageSize>();
	for (const file of files) {
		const size = knownSizes.get(file);
		if (size) sizes.set(file, size);
	}
	return sizes;
}
