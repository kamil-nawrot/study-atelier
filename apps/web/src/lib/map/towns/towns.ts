import type { PlacePoint } from '#lib/map/types/place-point.ts';
import type { Town } from '#lib/map/types/town.ts';

const EARTH_RADIUS_KM = 6371;
const TOWN_REACH_KM = 40;

export function distanceKm(from: PlacePoint, to: PlacePoint): number {
	const radians = Math.PI / 180;
	const latitude = (to.latitude - from.latitude) * radians;
	const longitude = (to.longitude - from.longitude) * radians;
	const a =
		Math.sin(latitude / 2) ** 2 +
		Math.cos(from.latitude * radians) *
			Math.cos(to.latitude * radians) *
			Math.sin(longitude / 2) ** 2;
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function nearestTown(point: PlacePoint, towns: readonly Town[]): Town | null {
	let best: Town | null = null;
	let bestDistance = TOWN_REACH_KM;
	for (const town of towns) {
		if (Math.abs(town.latitude - point.latitude) > 1) continue;
		const distance = distanceKm(point, town);
		if (distance <= bestDistance) {
			best = town;
			bestDistance = distance;
		}
	}
	return best;
}
