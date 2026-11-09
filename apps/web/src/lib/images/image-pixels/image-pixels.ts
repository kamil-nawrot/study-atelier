export const PIXEL_SIDE = 64;

type Size = { width: number; height: number };

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

function sampleSize({ width, height }: Size): Size {
	const scale = Math.min(1, PIXEL_SIDE / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
}

async function bitmapOf(blob: Blob, shape: Size | undefined): Promise<Drawable | undefined> {
	const size = shape ? sampleSize(shape) : { width: PIXEL_SIDE, height: PIXEL_SIDE };
	try {
		const bitmap = await createImageBitmap(blob, {
			resizeWidth: size.width,
			resizeHeight: size.height,
			resizeQuality: 'high'
		});
		return {
			source: bitmap,
			width: bitmap.width,
			height: bitmap.height,
			release: () => bitmap.close()
		};
	} catch {
		return undefined;
	}
}

async function elementOf(blob: Blob): Promise<Drawable | undefined> {
	const url = URL.createObjectURL(blob);
	try {
		const image = new Image();
		image.src = url;
		await image.decode();
		return {
			source: image,
			width: image.naturalWidth || PIXEL_SIDE,
			height: image.naturalHeight || PIXEL_SIDE,
			release: () => URL.revokeObjectURL(url)
		};
	} catch {
		URL.revokeObjectURL(url);
		return undefined;
	}
}

export async function readPixels(blob: Blob, shape?: Size): Promise<Uint8ClampedArray | undefined> {
	const drawable = (await bitmapOf(blob, shape)) ?? (await elementOf(blob));
	if (!drawable) return undefined;
	try {
		const { width, height } = sampleSize(drawable);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) return undefined;
		context.drawImage(drawable.source, 0, 0, width, height);
		return context.getImageData(0, 0, width, height).data;
	} catch {
		return undefined;
	} finally {
		drawable.release();
	}
}
