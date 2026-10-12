import { locale } from '#lib/i18n/index.ts';

export const IMAGES_BUCKET = 'artwork-images';
export const OWN_IMAGE_MAX_MEGABYTES = 5;
export const OWN_IMAGE_MAX_BYTES = OWN_IMAGE_MAX_MEGABYTES * 1024 * 1024;

export const OWN_IMAGE_EXTENSIONS = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/avif': 'avif'
} as const;

export type OwnImageType = keyof typeof OWN_IMAGE_EXTENSIONS;

export const OWN_IMAGE_TYPES = Object.keys(OWN_IMAGE_EXTENSIONS) as OwnImageType[];

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
