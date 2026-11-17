import type { CityGroup, CitySpot, FannedCity } from '#lib/map/map-groups/map-groups.ts';

export const FAN_LIMIT = 6;
const DISC_MARGIN = 28;
const ZOOM_MARGIN = 48;

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };

export function zoomsIn(group: CityGroup, canZoom: boolean): boolean {
	return canZoom && group.cities.length > FAN_LIMIT;
}

export function groupBox(group: CityGroup, spots: readonly CitySpot[]): Box {
	const members = spots.filter((spot) => group.cities.includes(spot.city));
	const xs = members.map((spot) => spot.x);
	const ys = members.map((spot) => spot.y);
	return {
		left: Math.min(...xs),
		top: Math.min(...ys),
		right: Math.max(...xs),
		bottom: Math.max(...ys)
	};
}

export function zoomFactor(box: Box, width: number, height: number): number {
	const across = Math.max(box.right - box.left, 1);
	const down = Math.max(box.bottom - box.top, 1);
	return Math.min((width - 2 * ZOOM_MARGIN) / across, (height - 2 * ZOOM_MARGIN) / down);
}

export function discReach(centre: Point, cities: readonly FannedCity[]): number {
	return (
		Math.max(
			...cities.map((city) => Math.hypot(city.x - centre.x, city.y - centre.y) + city.radius)
		) + DISC_MARGIN
	);
}

function shift(at: number, reach: number, size: number): number {
	if (2 * reach >= size) return size / 2 - at;
	if (at - reach < 0) return reach - at;
	if (at + reach > size) return size - reach - at;
	return 0;
}

export function intoView(centre: Point, reach: number, width: number, height: number): Point {
	return { x: shift(centre.x, reach, width), y: shift(centre.y, reach, height) };
}
