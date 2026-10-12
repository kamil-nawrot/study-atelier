import { m } from '#lib/i18n/index.ts';
import { COMMONS_THUMBNAIL_WIDTHS, commonsFileUrl, commonsSrcset } from '#lib/images/commons.ts';
import { commonsCredit } from '#lib/images/credit.ts';
import type { ArtworkImageInput } from './types.ts';

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
			return { src: image.url, width: image.width ?? undefined, height: image.height ?? undefined };
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

export function artworkImageCredit(image: ArtworkImageInput | null): string | undefined {
	if (image === null) return undefined;
	if (image.kind === 'commons') return commonsCredit(image.licence, image.attribution);
	if (image.kind === 'url') return m.artworkForm.ownImageUrlCredit(new URL(image.url).hostname);
	return m.artworkForm.ownImageCredit;
}
