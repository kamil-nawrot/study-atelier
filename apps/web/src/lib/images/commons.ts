export type ImageSize = {
	width: number;
	height: number;
};

export type CommonsImage = ImageSize & {
	thumbnailUrl: string;
};

export const COMMONS_THUMBNAIL_WIDTHS = [250, 330, 500, 960, 1280, 1920] as const;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const TITLES_PER_REQUEST = 50;
const API_USER_AGENT = 'study-atelier (https://github.com/kamil-nawrot/study-atelier)';
const MAX_RETRY_SECONDS = 5;

type ImageInfoResponse = {
	query?: {
		normalized?: { from: string; to: string }[];
		pages?: { title: string; imageinfo?: (ImageSize & { thumburl?: string })[] }[];
	};
};

export function commonsFileUrl(file: string, width: number): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function commonsSrcset(file: string, widths: readonly number[]): string {
	return widths.map((width) => `${commonsFileUrl(file, width)} ${width}w`).join(', ');
}

export function commonsThumbnailSrcset(
	image: CommonsImage,
	thumbnailWidth: number,
	widths: readonly number[]
): string | undefined {
	const segment = `/${thumbnailWidth}px-`;
	if (!image.thumbnailUrl.includes(segment)) return undefined;
	return widths
		.filter((width) => width <= image.width)
		.map((width) => `${image.thumbnailUrl.replace(segment, `/${width}px-`)} ${width}w`)
		.join(', ');
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

async function fetchImageBatch(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, CommonsImage>> {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		formatversion: '2',
		origin: '*',
		prop: 'imageinfo',
		iiprop: 'size|url',
		iiurlwidth: String(thumbnailWidth),
		titles: files.map(fileTitle).join('|')
	});
	const response = await fetchWithRetry(`${COMMONS_API}?${params}`);
	if (!response.ok) throw new Error(`Commons API answered ${response.status}`);
	const { query }: ImageInfoResponse = await response.json();
	const imagesByTitle = new Map<string, CommonsImage>();
	for (const page of query?.pages ?? []) {
		const info = page.imageinfo?.[0];
		if (info?.thumburl) {
			imagesByTitle.set(page.title, {
				width: info.width,
				height: info.height,
				thumbnailUrl: info.thumburl
			});
		}
	}
	const normalized = new Map((query?.normalized ?? []).map(({ from, to }) => [from, to]));
	const images = new Map<string, CommonsImage>();
	for (const file of files) {
		const title = fileTitle(file);
		const image = imagesByTitle.get(normalized.get(title) ?? title);
		if (image) images.set(file, image);
	}
	return images;
}

export async function fetchCommonsImages(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, CommonsImage>> {
	const unique = [...new Set(files)];
	const images = new Map<string, CommonsImage>();
	for (let start = 0; start < unique.length; start += TITLES_PER_REQUEST) {
		try {
			const batch = await fetchImageBatch(
				unique.slice(start, start + TITLES_PER_REQUEST),
				thumbnailWidth
			);
			batch.forEach((image, file) => images.set(file, image));
		} catch {
			break;
		}
	}
	return images;
}
