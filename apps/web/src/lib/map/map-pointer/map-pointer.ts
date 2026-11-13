import type { MapZoom } from '#lib/map/map-zoom/map-zoom.svelte.ts';

const TAP_DISTANCE = 4;
const WHEEL_STEP = 1.0015;

type Spot = { x: number; y: number };

export class MapPointer {
	#zoom: MapZoom;
	#ontap: (x: number, y: number) => void;
	#onmove: () => void;
	#spots = new Map<number, Spot>();
	#start: Spot | null = null;
	#moved = false;

	constructor(zoom: MapZoom, ontap: (x: number, y: number) => void, onmove: () => void = () => {}) {
		this.#zoom = zoom;
		this.#ontap = ontap;
		this.#onmove = onmove;
	}

	#spotOf(event: PointerEvent | WheelEvent): Spot {
		const box = (event.currentTarget as Element).getBoundingClientRect();
		return { x: event.clientX - box.left, y: event.clientY - box.top };
	}

	down(event: PointerEvent): void {
		const spot = this.#spotOf(event);
		(event.currentTarget as Element).setPointerCapture?.(event.pointerId);
		this.#spots.set(event.pointerId, spot);
		if (this.#spots.size === 1) {
			this.#start = spot;
			this.#moved = false;
		} else {
			this.#moved = true;
		}
	}

	move(event: PointerEvent): void {
		const previous = this.#spots.get(event.pointerId);
		if (!previous) return;
		const spot = this.#spotOf(event);
		if (this.#spots.size === 2) {
			const other = [...this.#spots.entries()].find(([id]) => id !== event.pointerId)?.[1];
			if (other) this.#pinch(previous, spot, other);
		} else {
			this.#zoom.panBy(spot.x - previous.x, spot.y - previous.y);
			if (spot.x !== previous.x || spot.y !== previous.y) this.#onmove();
		}
		this.#spots.set(event.pointerId, spot);
		if (this.#start && Math.hypot(spot.x - this.#start.x, spot.y - this.#start.y) > TAP_DISTANCE) {
			this.#moved = true;
		}
	}

	#pinch(previous: Spot, spot: Spot, other: Spot): void {
		const before = Math.hypot(previous.x - other.x, previous.y - other.y);
		const after = Math.hypot(spot.x - other.x, spot.y - other.y);
		if (before === 0) return;
		this.#zoom.zoomAt((spot.x + other.x) / 2, (spot.y + other.y) / 2, after / before);
		this.#onmove();
	}

	up(event: PointerEvent): void {
		const spot = this.#spots.get(event.pointerId);
		this.#spots.delete(event.pointerId);
		if (this.#spots.size > 0 || !spot) return;
		if (!this.#moved) this.#ontap(spot.x, spot.y);
		this.#start = null;
	}

	cancel(event: PointerEvent): void {
		this.#spots.delete(event.pointerId);
		this.#moved = true;
	}

	wheel(event: WheelEvent): void {
		event.preventDefault();
		const spot = this.#spotOf(event);
		this.#zoom.zoomAt(spot.x, spot.y, WHEEL_STEP ** -event.deltaY);
		this.#onmove();
	}
}
