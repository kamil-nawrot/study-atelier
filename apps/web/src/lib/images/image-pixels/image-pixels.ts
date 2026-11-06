export const PIXEL_SIDE = 64;

type Drawable = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function bitmapOf(blob: Blob): Promise<Drawable | undefined> {
	try {
		const bitmap = await createImageBitmap(blob);
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

export async function readPixels(blob: Blob): Promise<Uint8ClampedArray | undefined> {
	const drawable = (await bitmapOf(blob)) ?? (await elementOf(blob));
	if (!drawable) return undefined;
	try {
		const scale = Math.min(1, PIXEL_SIDE / Math.max(drawable.width, drawable.height));
		const width = Math.max(1, Math.round(drawable.width * scale));
		const height = Math.max(1, Math.round(drawable.height * scale));
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
