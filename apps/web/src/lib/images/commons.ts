export const COMMONS_THUMBNAIL_WIDTHS = [250, 330, 500, 960, 1280, 1920] as const;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const TITLES_PER_REQUEST = 50;
const API_USER_AGENT = 'study-atelier (https://github.com/kamil-nawrot/study-atelier)';
const MAX_RETRY_SECONDS = 5;

type ImageInfoResponse = {
	query?: {
		normalized?: { from: string; to: string }[];
		pages?: { title: string; imageinfo?: { thumburl?: string }[] }[];
	};
};

export function commonsFileUrl(file: string, width: number): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function commonsSrcset(file: string, widths: readonly number[]): string {
	return widths.map((width) => `${commonsFileUrl(file, width)} ${width}w`).join(', ');
}

export function commonsThumbnailSrcset(
	thumbnailUrl: string,
	thumbnailWidth: number,
	widths: readonly number[]
): string | undefined {
	const segment = `/${thumbnailWidth}px-`;
	if (!thumbnailUrl.includes(segment)) return undefined;
	return widths
		.map((width) => `${thumbnailUrl.replace(segment, `/${width}px-`)} ${width}w`)
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

async function fetchThumbnailBatch(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, string>> {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		formatversion: '2',
		origin: '*',
		prop: 'imageinfo',
		iiprop: 'url',
		iiurlwidth: String(thumbnailWidth),
		titles: files.map(fileTitle).join('|')
	});
	const response = await fetchWithRetry(`${COMMONS_API}?${params}`);
	if (!response.ok) throw new Error(`Commons API answered ${response.status}`);
	const { query }: ImageInfoResponse = await response.json();
	const thumbnailsByTitle = new Map<string, string>();
	for (const page of query?.pages ?? []) {
		const thumbnailUrl = page.imageinfo?.[0]?.thumburl;
		if (thumbnailUrl) thumbnailsByTitle.set(page.title, thumbnailUrl);
	}
	const normalized = new Map((query?.normalized ?? []).map(({ from, to }) => [from, to]));
	const thumbnails = new Map<string, string>();
	for (const file of files) {
		const title = fileTitle(file);
		const thumbnailUrl = thumbnailsByTitle.get(normalized.get(title) ?? title);
		if (thumbnailUrl) thumbnails.set(file, thumbnailUrl);
	}
	return thumbnails;
}

export async function fetchCommonsThumbnails(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, string>> {
	const unique = [...new Set(files)];
	const thumbnails = new Map<string, string>();
	for (let start = 0; start < unique.length; start += TITLES_PER_REQUEST) {
		try {
			const batch = await fetchThumbnailBatch(
				unique.slice(start, start + TITLES_PER_REQUEST),
				thumbnailWidth
			);
			batch.forEach((thumbnailUrl, file) => thumbnails.set(file, thumbnailUrl));
		} catch {
			break;
		}
	}
	return thumbnails;
}
