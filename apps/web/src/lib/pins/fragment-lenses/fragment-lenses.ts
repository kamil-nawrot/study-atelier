import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
import { ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { pinCropRect } from '#lib/pins/pin-crop-rect/pin-crop-rect.ts';
import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import type { FragmentThumbnail } from '#lib/pins/types/fragment-thumbnail.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

const MEDIUM_WIDTH = 960;
const SCALE = 1000;

function thumbnailPath(fragment: PinFragment): string | undefined {
	return fragment.image?.kind === 'upload' ? ownThumbnailPath(fragment.image.path) : undefined;
}

function thumbnailOf(fragment: PinFragment, urls: Map<string, string>): FragmentThumbnail {
	const path = thumbnailPath(fragment);
	const src = path ? urls.get(path) : artworkImageSource(fragment.image, MEDIUM_WIDTH)?.src;
	const { width, height } = fragment.image ?? {};
	const imageWidth = width && height ? (SCALE * width) / height : SCALE;
	const rect = pinCropRect(fragment, imageWidth, SCALE) ?? { left: 0, top: 0, side: SCALE };
	const percent = (value: number): number => (100 * value) / rect.side;
	return {
		...(src ? { src } : {}),
		left: -percent(rect.left),
		top: -percent(rect.top),
		width: percent(imageWidth),
		height: percent(SCALE)
	};
}

export async function fragmentLenses(
	fragments: readonly PinFragment[]
): Promise<Map<string, FragmentLens>> {
	const paths = fragments
		.flatMap((fragment) => [fragment.cropPath, thumbnailPath(fragment)])
		.filter((path): path is string => path !== undefined);
	const urls = await ownImageUrls(paths);
	return new Map(
		fragments.map((fragment) => {
			const crop = fragment.cropPath ? urls.get(fragment.cropPath) : undefined;
			return [
				fragment.pinId,
				{ ...(crop ? { crop } : {}), thumbnail: thumbnailOf(fragment, urls) }
			];
		})
	);
}
