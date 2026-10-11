export type ImageSize = {
	width: number;
	height: number;
};

export const COMMONS_THUMBNAIL_WIDTHS = [250, 330, 500, 960, 1280, 1920] as const;

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const TITLES_PER_REQUEST = 50;

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
	const response = await fetch(`${COMMONS_API}?${params}`);
	if (!response.ok) return new Map();
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
	const unique = [...new Set(files)];
	const sizes = new Map<string, ImageSize>();
	for (let start = 0; start < unique.length; start += TITLES_PER_REQUEST) {
		try {
			const batch = await fetchSizeBatch(unique.slice(start, start + TITLES_PER_REQUEST));
			batch.forEach((size, file) => sizes.set(file, size));
		} catch {
			return sizes;
		}
	}
	return sizes;
}
