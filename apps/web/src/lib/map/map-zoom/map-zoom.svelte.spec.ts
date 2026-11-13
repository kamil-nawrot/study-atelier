import { describe, expect, it } from 'vitest';
import { MapZoom, MAX_ZOOM } from './map-zoom.svelte.ts';

describe('MapZoom', () => {
	it('zooms around a spot that stays in place', () => {
		const zoom = new MapZoom();

		zoom.zoomAt(100, 50, 2);

		expect(zoom.toScreen(100, 50)).toEqual([100, 50]);
		expect(zoom.toMap(...zoom.toScreen(30, 40))).toEqual([30, 40]);
		expect(zoom.scale).toBe(2);
	});

	it('keeps the zoom between the whole map and the closest view', () => {
		const zoom = new MapZoom();

		zoom.zoomAt(0, 0, 0.5);
		expect(zoom.scale).toBe(1);
		zoom.zoomAt(0, 0, 100);
		expect(zoom.scale).toBe(MAX_ZOOM);
	});

	it('moves the map and returns to the start', () => {
		const zoom = new MapZoom();

		zoom.panBy(20, -10);
		expect(zoom.toScreen(0, 0)).toEqual([20, -10]);
		zoom.reset();
		expect(zoom.toScreen(0, 0)).toEqual([0, 0]);
	});

	it('keeps the view inside the bounds of the map', () => {
		const zoom = new MapZoom();
		zoom.limit({ left: -100, top: -50, right: 300, bottom: 250 }, 200, 200);

		zoom.panBy(0, 500);
		expect(zoom.y).toBe(50);
		zoom.panBy(-1000, -1000);
		expect([zoom.x, zoom.y]).toEqual([-100, -50]);
		zoom.zoomAt(0, 0, 2);
		zoom.panBy(1000, 0);
		expect(zoom.x).toBe(200);
	});

	it('centres bounds smaller than the view', () => {
		const zoom = new MapZoom();
		zoom.limit({ left: 0, top: 0, right: 100, bottom: 100 }, 300, 200);

		zoom.panBy(500, 500);
		expect([zoom.x, zoom.y]).toEqual([100, 50]);
	});
});
