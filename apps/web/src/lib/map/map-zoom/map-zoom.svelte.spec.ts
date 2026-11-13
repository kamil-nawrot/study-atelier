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
});
