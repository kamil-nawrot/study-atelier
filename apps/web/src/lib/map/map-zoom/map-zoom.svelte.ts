export const MIN_ZOOM = 1;
export const MAX_ZOOM = 64;
export const ZOOM_STEP = 1.6;

export class MapZoom {
	max = $state(MAX_ZOOM);
	scale = $state(1);
	x = $state(0);
	y = $state(0);

	zoomAt(centreX: number, centreY: number, factor: number): void {
		const scale = Math.min(this.max, Math.max(MIN_ZOOM, this.scale * factor));
		const applied = scale / this.scale;
		this.x = centreX - (centreX - this.x) * applied;
		this.y = centreY - (centreY - this.y) * applied;
		this.scale = scale;
	}

	panBy(deltaX: number, deltaY: number): void {
		this.x += deltaX;
		this.y += deltaY;
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
	}
}
