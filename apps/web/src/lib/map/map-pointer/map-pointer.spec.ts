import { describe, expect, it, vi } from 'vitest';
import { MapZoom } from '#lib/map/map-zoom/map-zoom.svelte.ts';
import { MapPointer } from './map-pointer.ts';

const target = {
	getBoundingClientRect: () => ({ left: 10, top: 20 }),
	setPointerCapture: vi.fn()
};

function pointer(pointerId: number, clientX: number, clientY: number): PointerEvent {
	return { pointerId, clientX, clientY, currentTarget: target } as unknown as PointerEvent;
}

describe('MapPointer', () => {
	it('reports a tap where the pointer went down and up without moving', () => {
		const ontap = vi.fn();
		const gestures = new MapPointer(new MapZoom(), ontap);

		gestures.down(pointer(1, 110, 70));
		gestures.move(pointer(1, 112, 71));
		gestures.up(pointer(1, 112, 71));

		expect(ontap).toHaveBeenCalledWith(102, 51);
	});

	it('moves the map with a drag, which is not a tap', () => {
		const ontap = vi.fn();
		const zoom = new MapZoom();
		const gestures = new MapPointer(zoom, ontap);

		gestures.down(pointer(1, 110, 70));
		gestures.move(pointer(1, 160, 90));
		gestures.up(pointer(1, 160, 90));

		expect(zoom.toScreen(0, 0)).toEqual([50, 20]);
		expect(ontap).not.toHaveBeenCalled();
	});

	it('reports every move of the map, by a drag or the wheel', () => {
		const onmove = vi.fn();
		const gestures = new MapPointer(new MapZoom(), vi.fn(), onmove);

		gestures.down(pointer(1, 110, 70));
		gestures.move(pointer(1, 110, 70));
		expect(onmove).not.toHaveBeenCalled();
		gestures.move(pointer(1, 130, 80));
		gestures.up(pointer(1, 130, 80));
		gestures.wheel({
			clientX: 50,
			clientY: 50,
			deltaY: -100,
			currentTarget: target,
			preventDefault: vi.fn()
		} as unknown as WheelEvent);

		expect(onmove).toHaveBeenCalledTimes(2);
	});

	it('zooms with two fingers apart and with the wheel', () => {
		const zoom = new MapZoom();
		const gestures = new MapPointer(zoom, vi.fn());

		gestures.down(pointer(1, 110, 120));
		gestures.down(pointer(2, 210, 120));
		gestures.move(pointer(2, 310, 120));
		gestures.cancel(pointer(2, 310, 120));
		gestures.up(pointer(1, 110, 120));
		expect(zoom.scale).toBeCloseTo(2);

		const wheel = {
			clientX: 110,
			clientY: 120,
			deltaY: -200,
			currentTarget: target,
			preventDefault: vi.fn()
		};
		gestures.wheel(wheel as unknown as WheelEvent);
		expect(wheel.preventDefault).toHaveBeenCalled();
		expect(zoom.scale).toBeGreaterThan(2);
	});
});
