import { geoMercator, type GeoProjection } from 'd3-geo';
import type { MapBounds } from '#lib/map/types/map-bounds.ts';
import type { PlacePoint } from '#lib/map/types/place-point.ts';

const PADDING = 48;
const NORTH_EDGE = 80;
const SOUTH_EDGE = -60;
const HALF_TURN = 179.9;
const SINGLE_POINT_SPAN = 4;
const DEFAULT_VIEW: PlacePoint[] = [
	{ latitude: 35, longitude: -10 },
	{ latitude: 60, longitude: 30 }
];

function spanOf(points: readonly PlacePoint[]): PlacePoint[] {
	if (points.length === 0) return DEFAULT_VIEW;
	const latitudes = points.map((point) => point.latitude);
	const longitudes = points.map((point) => point.longitude);
	const south = Math.min(...latitudes);
	const north = Math.max(...latitudes);
	const west = Math.min(...longitudes);
	const east = Math.max(...longitudes);
	const latitudeMargin = Math.max(0, SINGLE_POINT_SPAN - (north - south)) / 2;
	const longitudeMargin = Math.max(0, SINGLE_POINT_SPAN - (east - west)) / 2;
	return [
		{ latitude: Math.max(-80, south - latitudeMargin), longitude: west - longitudeMargin },
		{ latitude: Math.min(80, north + latitudeMargin), longitude: east + longitudeMargin }
	];
}

export function mapProjection(
	points: readonly PlacePoint[],
	width: number,
	height: number
): GeoProjection {
	const [southWest, northEast] = spanOf(points);
	const centre = (southWest.longitude + northEast.longitude) / 2;
	const padding = Math.min(PADDING, width / 6, height / 6);
	return geoMercator()
		.rotate([-centre, 0])
		.fitExtent(
			[
				[padding, padding],
				[width - padding, height - padding]
			],
			{
				type: 'MultiPoint',
				coordinates: [
					[southWest.longitude, southWest.latitude],
					[northEast.longitude, southWest.latitude],
					[northEast.longitude, northEast.latitude],
					[southWest.longitude, northEast.latitude],
					[centre, southWest.latitude],
					[centre, northEast.latitude]
				]
			}
		)
		.clipExtent([
			[-width * 2, -height * 2],
			[width * 3, height * 3]
		]);
}

export function mapBounds(projection: GeoProjection): MapBounds | null {
	const centre = -projection.rotate()[0];
	const northWest = projection([centre - HALF_TURN, NORTH_EDGE]);
	const southEast = projection([centre + HALF_TURN, SOUTH_EDGE]);
	if (!northWest || !southEast) return null;
	const [[clipLeft, clipTop], [clipRight, clipBottom]] = projection.clipExtent() ?? [
		[-Infinity, -Infinity],
		[Infinity, Infinity]
	];
	return {
		left: Math.max(northWest[0], clipLeft),
		top: Math.max(northWest[1], clipTop),
		right: Math.min(southEast[0], clipRight),
		bottom: Math.min(southEast[1], clipBottom)
	};
}
