import { locale } from '#lib/i18n/i18n.ts';

export const IMAGES_BUCKET = 'artwork-images';
export const OWN_IMAGE_MAX_MEGABYTES = 5;
export const OWN_IMAGE_MAX_BYTES = OWN_IMAGE_MAX_MEGABYTES * 1024 * 1024;
export const OWN_IMAGE_MAX_SOURCE_MEGABYTES = 50;
export const OWN_IMAGE_MAX_SOURCE_BYTES = OWN_IMAGE_MAX_SOURCE_MEGABYTES * 1024 * 1024;
export const OWN_IMAGE_SMALLER_SIDES = [3200, 2400, 1600];
export const OWN_IMAGE_SMALLER_QUALITY = 0.9;
export const SIGNED_URL_SECONDS = 60 * 60;
export const OWN_THUMBNAIL_WIDTH = 500;
export const OWN_THUMBNAIL_QUALITY = 0.85;
export const OWN_THUMBNAIL_TYPE = 'image/jpeg';

export function ownThumbnailPath(path: string): string {
	const dot = path.lastIndexOf('.');
	const stem = dot > path.lastIndexOf('/') ? path.slice(0, dot) : path;
	return `${stem}-thumb.jpg`;
}

export const OWN_IMAGE_EXTENSIONS = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
} as const;

export type OwnImageType = keyof typeof OWN_IMAGE_EXTENSIONS;

export const OWN_IMAGE_TYPES = Object.keys(OWN_IMAGE_EXTENSIONS) as OwnImageType[];

export const OWN_IMAGE_ACCEPT = [
	...OWN_IMAGE_TYPES,
	...Object.values(OWN_IMAGE_EXTENSIONS).map((extension) => `.${extension}`),
	'.jpeg'
].join(',');

export function isOwnImageType(type: string): type is OwnImageType {
	return Object.hasOwn(OWN_IMAGE_EXTENSIONS, type);
}

const FORMAT_NAMES: Record<OwnImageType, string> = {
	'image/jpeg': 'JPG',
	'image/png': 'PNG',
	'image/webp': 'WebP',
	'image/gif': 'GIF',
	'image/avif': 'AVIF'
};

export function ownImageFormats(): string {
	return new Intl.ListFormat(locale, { type: 'disjunction' }).format(
		OWN_IMAGE_TYPES.map((type) => FORMAT_NAMES[type])
	);
}
