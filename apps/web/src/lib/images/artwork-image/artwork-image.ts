import { m } from '#lib/i18n/index.ts';
import {
	COMMONS_LOUPE_WIDTH,
	COMMONS_THUMBNAIL_WIDTHS,
	COMMONS_UPLOAD_THUMBNAIL_WIDTHS,
	commonsFileUrl,
	commonsOriginalUrl,
	commonsSrcset,
	commonsUploadOriginalUrl,
	commonsUploadThumbnailUrl,
	commonsUploadThumbnailWidth
} from '#lib/images/commons.ts';
import { commonsCredit } from '#lib/images/credit.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export const LOUPE_MAX_LINKED_MEGAPIXELS = 40;

export type ArtworkImageSource = {
	src: string;
	srcset?: string;
	width?: number;
	height?: number;
};

export function artworkImageSource(
	image: ArtworkImageInput | null,
	width: number
): ArtworkImageSource | undefined {
	if (image === null) return undefined;
	switch (image.kind) {
		case 'commons':
			return {
				src: commonsFileUrl(image.file, width),
				srcset: commonsSrcset(
					image.file,
					COMMONS_THUMBNAIL_WIDTHS.filter((size) => image.width === null || size <= image.width)
				),
				width: image.width ?? undefined,
				height: image.height ?? undefined
			};
		case 'file':
			return { src: image.previewUrl, width: image.width, height: image.height };
		case 'url':
			return linkedImageSource(image, width);
		case 'upload':
			return image.previewUrl
				? {
						src: image.previewUrl,
						width: image.width ?? undefined,
						height: image.height ?? undefined
					}
				: undefined;
	}
}

function linkedImageSource(
	image: Extract<ArtworkImageInput, { kind: 'url' }>,
	width: number
): ArtworkImageSource {
	const source = {
		width: image.width ?? undefined,
		height: image.height ?? undefined
	};
	const original = commonsUploadOriginalUrl(image.url);
	if (original === undefined || !image.width) return { src: image.url, ...source };
	const fileWidth = image.width;
	const widths = COMMONS_UPLOAD_THUMBNAIL_WIDTHS.filter((size) => size < fileWidth);
	const snapped = commonsUploadThumbnailWidth(width);
	const src =
		snapped < fileWidth ? (commonsUploadThumbnailUrl(image.url, snapped) ?? original) : original;
	const srcset = widths
		.map((size) => `${commonsUploadThumbnailUrl(image.url, size)} ${size}w`)
		.concat(fileWidth <= COMMONS_LOUPE_WIDTH ? [`${original} ${fileWidth}w`] : [])
		.join(', ');
	return { src, srcset, ...source };
}

export function isTooLargeForLoupe(image: ArtworkImageInput | null): boolean {
	if (image === null || image.kind !== 'url' || !image.width || !image.height) return false;
	if (commonsUploadOriginalUrl(image.url) !== undefined) return false;
	return image.width * image.height > LOUPE_MAX_LINKED_MEGAPIXELS * 1_000_000;
}

function linkedLargeSource(
	image: Extract<ArtworkImageInput, { kind: 'url' }>,
	width: number
): { src: string; width: number } | undefined {
	if (isTooLargeForLoupe(image)) return undefined;
	const original = commonsUploadOriginalUrl(image.url);
	if (original === undefined) return { src: image.url, width };
	if (width <= COMMONS_LOUPE_WIDTH) return { src: original, width };
	const src = commonsUploadThumbnailUrl(image.url, COMMONS_LOUPE_WIDTH);
	return src === undefined ? undefined : { src, width: COMMONS_LOUPE_WIDTH };
}

export function artworkLargeSource(
	image: ArtworkImageInput | null
): { src: string; width: number } | undefined {
	if (image === null || !image.width) return undefined;
	switch (image.kind) {
		case 'commons':
			return image.width > COMMONS_LOUPE_WIDTH
				? { src: commonsFileUrl(image.file, COMMONS_LOUPE_WIDTH), width: COMMONS_LOUPE_WIDTH }
				: { src: commonsOriginalUrl(image.file), width: image.width };
		case 'file':
			return { src: image.previewUrl, width: image.width };
		case 'url':
			return linkedLargeSource(image, image.width);
		case 'upload':
			return image.previewUrl ? { src: image.previewUrl, width: image.width } : undefined;
	}
}

export function artworkImageCredit(image: ArtworkImageInput | null): string | undefined {
	if (image === null) return undefined;
	if (image.kind === 'commons') return commonsCredit(image.licence, image.attribution);
	if (image.kind === 'url') return m.artworkForm.ownImageUrlCredit(new URL(image.url).hostname);
	return m.artworkForm.ownImageCredit;
}
