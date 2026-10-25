import type { ArtworkTileImage } from '@study-atelier/ui';
import {
	COMMONS_THUMBNAIL_WIDTHS,
	commonsFileUrl,
	commonsSrcset,
	commonsThumbnailSrcset
} from '#lib/images/commons/commons.ts';
import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
import { tileSizes } from '#lib/wall/masonry/masonry.ts';
import type { ImageSize } from '#lib/catalogue/types/image-size.ts';
import type { PendingImage } from '#lib/catalogue/types/pending-image.ts';
import type { MainImageRow } from '#lib/wall/types/main-image-row.ts';

export const DEFAULT_IMAGE_SIZE: ImageSize = { width: 4, height: 5 };

const TILE_SIZES = tileSizes();
export const TILE_WIDTH = 500;
const TILE_MAX_IMAGE_WIDTH = 960;

export function storedSize(image: MainImageRow | undefined): ImageSize | undefined {
	return image?.image_width && image.image_height
		? { width: image.image_width, height: image.image_height }
		: undefined;
}

function thumbnailWidths(size: ImageSize | undefined): number[] {
	const largest = Math.min(size?.width ?? TILE_WIDTH, TILE_MAX_IMAGE_WIDTH);
	return COMMONS_THUMBNAIL_WIDTHS.filter((width) => width <= largest);
}

export function commonsImage(
	file: string,
	thumbnailUrl: string | undefined,
	size: ImageSize | undefined
): ArtworkTileImage {
	const widths = thumbnailWidths(size);
	const srcset = thumbnailUrl
		? commonsThumbnailSrcset(thumbnailUrl, TILE_WIDTH, widths)
		: commonsSrcset(file, widths);
	return {
		src: thumbnailUrl ?? commonsFileUrl(file, TILE_WIDTH),
		srcset: srcset || undefined,
		sizes: TILE_SIZES,
		...(size ?? DEFAULT_IMAGE_SIZE)
	};
}

export function ownImage(
	src: string | undefined,
	size: ImageSize | undefined
): ArtworkTileImage | undefined {
	return src ? { src, ...(size ?? DEFAULT_IMAGE_SIZE) } : undefined;
}

export function linkedImage(
	url: string | undefined,
	size: ImageSize | undefined
): ArtworkTileImage | undefined {
	if (!url) return undefined;
	const source = artworkImageSource(
		{ kind: 'url', url, width: size?.width ?? null, height: size?.height ?? null },
		TILE_WIDTH
	);
	if (!source?.srcset) return ownImage(url, size);
	return {
		src: source.src,
		srcset: source.srcset,
		sizes: TILE_SIZES,
		...(size ?? DEFAULT_IMAGE_SIZE)
	};
}

export function pendingImageOf(
	main: MainImageRow | undefined,
	size: ImageSize | undefined
): PendingImage | undefined {
	if (main?.own_image_path) return { ownPath: main.own_image_path, size };
	if (main?.own_image_url) return undefined;
	return main?.source_image_file ? { sourceFile: main.source_image_file, size } : undefined;
}
