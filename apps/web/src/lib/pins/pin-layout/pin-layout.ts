import type { Pin } from '#lib/pins/types.ts';

export type Fraction = { x: number; y: number };

type Rect = { left: number; top: number; width: number; height: number };

export const PIN_NUDGE = 0.02;

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value));
}

export function fractionIn(clientX: number, clientY: number, rect: Rect): Fraction {
	if (rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
	return {
		x: clamp((clientX - rect.left) / rect.width),
		y: clamp((clientY - rect.top) / rect.height)
	};
}

export function pinsOfImage(pins: readonly Pin[], imageId: string | undefined): Pin[] {
	return imageId === undefined ? [] : pins.filter((pin) => pin.imageId === imageId);
}

export function nudged(pin: Fraction, key: string): Fraction | undefined {
	switch (key) {
		case 'ArrowLeft':
			return { x: clamp(pin.x - PIN_NUDGE), y: pin.y };
		case 'ArrowRight':
			return { x: clamp(pin.x + PIN_NUDGE), y: pin.y };
		case 'ArrowUp':
			return { x: pin.x, y: clamp(pin.y - PIN_NUDGE) };
		case 'ArrowDown':
			return { x: pin.x, y: clamp(pin.y + PIN_NUDGE) };
		default:
			return undefined;
	}
}
