import { artworkImageSource, artworkLargeSource } from '#lib/images/artwork-image/artwork-image.ts';
import { COMMONS_LOUPE_WIDTH, fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import { savePinCrop } from '#lib/pins/pin-crop-data/pin-crop-data.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { Pin } from '#lib/pins/types/pin.ts';

export const PIN_CROP_SIDE = 320;
const PIN_CROP_QUALITY = 0.85;
const FALLBACK_WIDTH = 960;

type Rect = { left: number; top: number; side: number };

const attempted = new Set<string>();
let queue: Promise<void> = Promise.resolve();

export function pinCropRect(
	pin: Pick<Pin, 'x' | 'y' | 'viewWidth'>,
	width: number,
	height: number
): Rect | undefined {
	if (!pin.viewWidth || width <= 0 || height <= 0) return undefined;
	const side = Math.max(1, Math.min(pin.viewWidth * width, width, height));
	const clamp = (centre: number, extent: number): number =>
		Math.min(Math.max(centre - side / 2, 0), extent - side);
	return { left: clamp(pin.x * width, width), top: clamp(pin.y * height, height), side };
}

export async function cutPinCrop(
	source: Blob,
	pin: Pick<Pin, 'x' | 'y' | 'viewWidth'>
): Promise<Blob | undefined> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(source);
	} catch {
		return undefined;
	}
	try {
		const rect = pinCropRect(pin, bitmap.width, bitmap.height);
		if (!rect) return undefined;
		const canvas = document.createElement('canvas');
		canvas.width = PIN_CROP_SIDE;
		canvas.height = PIN_CROP_SIDE;
		const context = canvas.getContext('2d');
		if (!context) return undefined;
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, PIN_CROP_SIDE, PIN_CROP_SIDE);
		context.drawImage(
			bitmap,
			rect.left,
			rect.top,
			rect.side,
			rect.side,
			0,
			0,
			PIN_CROP_SIDE,
			PIN_CROP_SIDE
		);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', PIN_CROP_QUALITY)
		);
		return blob ?? undefined;
	} catch {
		return undefined;
	} finally {
		bitmap.close();
	}
}

type CropSource = () => Promise<string | undefined>;

async function commonsCropSource(
	image: Extract<ArtworkImageInput, { kind: 'commons' }>
): Promise<string | undefined> {
	const width = image.width ? Math.min(image.width, COMMONS_LOUPE_WIDTH) : FALLBACK_WIDTH;
	const thumbnails = await fetchCommonsThumbnails([image.file], width);
	return thumbnails.get(image.file);
}

function cropSource(image: ArtworkImageInput): CropSource | undefined {
	if (image.kind === 'commons') return () => commonsCropSource(image);
	const src = artworkLargeSource(image)?.src ?? artworkImageSource(image, FALLBACK_WIDTH)?.src;
	return src === undefined ? undefined : () => Promise.resolve(src);
}

async function makeCrop(pin: Pin, source: CropSource): Promise<void> {
	try {
		const src = await source();
		if (!src) return;
		const response = await fetch(src, { mode: 'cors' });
		if (!response.ok) return;
		const crop = await cutPinCrop(await response.blob(), pin);
		if (crop) await savePinCrop(pin, crop);
	} catch {
		return;
	}
}

export function ensurePinCrops(
	images: readonly (ArtworkImageInput | null)[],
	pins: readonly Pin[]
): void {
	for (const pin of pins) {
		if (pin.viewWidth === undefined || pin.cropPath) continue;
		const key = `${pin.id}:${pin.x}:${pin.y}:${pin.viewWidth}`;
		if (attempted.has(key)) continue;
		const image = images.find((candidate) => candidate?.id === pin.imageId);
		const source = image ? cropSource(image) : undefined;
		if (!source) continue;
		attempted.add(key);
		queue = queue.then(() => makeCrop(pin, source));
	}
}
