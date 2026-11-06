import type { Pin } from '#lib/pins/types/pin.ts';

type Rect = { left: number; top: number; side: number };

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
