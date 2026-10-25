import { fetchJson } from '#lib/images/wikimedia/wikimedia.ts';

export const COMMONS_THUMBNAIL_WIDTHS = [250, 330, 500, 960, 1280, 1920] as const;
export const COMMONS_LOUPE_WIDTH = 3840;

export const COMMONS_UPLOAD_THUMBNAIL_WIDTHS = [...COMMONS_THUMBNAIL_WIDTHS, COMMONS_LOUPE_WIDTH];
const UPLOAD_FILE_PATTERN =
	/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png|webp))(?:[?#].*)?$/i;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const TITLES_PER_REQUEST = 50;
const RESPONSE_CACHE_SECONDS = 24 * 60 * 60;

type ExtMetadata = Partial<
	Record<'LicenseShortName' | 'LicenseUrl' | 'Artist', { value?: string }>
>;

type ImageInfo = {
	thumburl?: string;
	width?: number;
	height?: number;
	extmetadata?: ExtMetadata;
};

type ImageInfoResponse = {
	query?: {
		normalized?: { from: string; to: string }[];
		pages?: { title: string; imageinfo?: ImageInfo[] }[];
	};
};

type CommonsFile = {
	thumbnailUrl: string;
	width: number;
	height: number;
	licence: string | null;
	licenceUrl: string | null;
	attribution: string | null;
};

const HTML_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' '
};

export function commonsFileUrl(file: string, width: number): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function commonsOriginalUrl(file: string): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
}

export function commonsUploadOriginalUrl(url: string): string | undefined {
	const match = UPLOAD_FILE_PATTERN.exec(url);
	if (!match) return undefined;
	return `https://upload.wikimedia.org/wikipedia/commons/${match[1]}/${match[2]}/${match[3]}`;
}

export function commonsUploadThumbnailWidth(width: number): number {
	return COMMONS_UPLOAD_THUMBNAIL_WIDTHS.find((size) => size >= width) ?? COMMONS_LOUPE_WIDTH;
}

export function commonsUploadThumbnailUrl(url: string, width: number): string | undefined {
	const match = UPLOAD_FILE_PATTERN.exec(url);
	if (!match) return undefined;
	return `https://upload.wikimedia.org/wikipedia/commons/thumb/${match[1]}/${match[2]}/${match[3]}/${width}px-${match[3]}`;
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

export function plainText(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
			if (code.startsWith('#x') || code.startsWith('#X'))
				return String.fromCodePoint(parseInt(code.slice(2), 16));
			if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
			return HTML_ENTITIES[code.toLowerCase()] ?? entity;
		})
		.replace(/\s+/g, ' ')
		.trim();
}

async function fetchImageInfoBatch(
	files: string[],
	thumbnailWidth: number,
	details: boolean
): Promise<Map<string, ImageInfo>> {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		formatversion: '2',
		origin: '*',
		prop: 'imageinfo',
		iiprop: details ? 'url|size|extmetadata' : 'url',
		iiurlwidth: String(thumbnailWidth),
		maxage: String(RESPONSE_CACHE_SECONDS),
		smaxage: String(RESPONSE_CACHE_SECONDS),
		titles: files.map(fileTitle).join('|')
	});
	if (details) params.set('iiextmetadatafilter', 'LicenseShortName|LicenseUrl|Artist');
	const { query } = await fetchJson<ImageInfoResponse>(`${COMMONS_API}?${params}`);
	const infoByTitle = new Map<string, ImageInfo>();
	for (const page of query?.pages ?? []) {
		const info = page.imageinfo?.[0];
		if (info) infoByTitle.set(page.title, info);
	}
	const normalized = new Map((query?.normalized ?? []).map(({ from, to }) => [from, to]));
	const infoByFile = new Map<string, ImageInfo>();
	for (const file of files) {
		const title = fileTitle(file);
		const info = infoByTitle.get(normalized.get(title) ?? title);
		if (info) infoByFile.set(file, info);
	}
	return infoByFile;
}

export async function fetchCommonsThumbnails(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, string>> {
	const unique = [...new Set(files)];
	const thumbnails = new Map<string, string>();
	for (let start = 0; start < unique.length; start += TITLES_PER_REQUEST) {
		try {
			const batch = await fetchImageInfoBatch(
				unique.slice(start, start + TITLES_PER_REQUEST),
				thumbnailWidth,
				false
			);
			batch.forEach(({ thumburl }, file) => {
				if (thumburl) thumbnails.set(file, thumburl);
			});
		} catch {
			break;
		}
	}
	return thumbnails;
}

function metadata(info: ImageInfo, key: keyof ExtMetadata): string | null {
	const value = info.extmetadata?.[key]?.value;
	const text = value ? plainText(value) : '';
	return text === '' ? null : text;
}

export async function fetchCommonsFiles(
	files: string[],
	thumbnailWidth: number
): Promise<Map<string, CommonsFile>> {
	const unique = [...new Set(files)].slice(0, TITLES_PER_REQUEST);
	const result = new Map<string, CommonsFile>();
	if (unique.length === 0) return result;
	const batch = await fetchImageInfoBatch(unique, thumbnailWidth, true);
	batch.forEach((info, file) => {
		if (!info.thumburl || !info.width || !info.height) return;
		result.set(file, {
			thumbnailUrl: info.thumburl,
			width: info.width,
			height: info.height,
			licence: metadata(info, 'LicenseShortName'),
			licenceUrl: metadata(info, 'LicenseUrl'),
			attribution: metadata(info, 'Artist')
		});
	});
	return result;
}
