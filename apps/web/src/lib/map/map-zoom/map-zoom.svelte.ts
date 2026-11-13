import type { MapBounds } from '#lib/map/types/map-bounds.ts';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 16;
export const ZOOM_STEP = 1.6;

export class MapZoom {
	scale = $state(1);
	x = $state(0);
	y = $state(0);
	#bounds: MapBounds | null = null;
	#width = 0;
	#height = 0;

	limit(bounds: MapBounds | null, width: number, height: number): void {
		this.#bounds = bounds;
		this.#width = width;
		this.#height = height;
		this.#clamp();
	}

	#axis(offset: number, start: number, end: number, size: number): number {
		const lowest = size - end * this.scale;
		const highest = -start * this.scale;
		if (lowest > highest) return (lowest + highest) / 2;
		return Math.min(highest, Math.max(lowest, offset));
	}

	#clamp(): void {
		const bounds = this.#bounds;
		if (!bounds || this.#width === 0 || this.#height === 0) return;
		this.x = this.#axis(this.x, bounds.left, bounds.right, this.#width);
		this.y = this.#axis(this.y, bounds.top, bounds.bottom, this.#height);
	}

	zoomAt(centreX: number, centreY: number, factor: number): void {
		const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.scale * factor));
		const applied = scale / this.scale;
		this.x = centreX - (centreX - this.x) * applied;
		this.y = centreY - (centreY - this.y) * applied;
		this.scale = scale;
		this.#clamp();
	}

	panBy(deltaX: number, deltaY: number): void {
		this.x += deltaX;
		this.y += deltaY;
		this.#clamp();
	}

	toScreen(x: number, y: number): [number, number] {
		return [x * this.scale + this.x, y * this.scale + this.y];
	}

	toMap(x: number, y: number): [number, number] {
		return [(x - this.x) / this.scale, (y - this.y) / this.scale];
	}

	reset(): void {
		this.scale = 1;
		this.x = 0;
		this.y = 0;
		this.#clamp();
	}
}
