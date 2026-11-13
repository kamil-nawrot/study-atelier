import type { Geography } from '#lib/map/types/geography.ts';
import type { MapPlace } from '#lib/map/types/map-place.ts';

export function testGeography(): Geography {
	return {
		land: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[-10, 36],
								[-10, 60],
								[30, 60],
								[30, 36],
								[-10, 36]
							]
						]
					}
				}
			]
		},
		borders: {
			type: 'MultiLineString',
			coordinates: [
				[
					[8, 45],
					[8, 55]
				]
			]
		},
		towns: [
			{ name: 'Paryż', countryCode: 'FR', longitude: 2.35, latitude: 48.857 },
			{ name: 'Berlin', countryCode: 'DE', longitude: 13.4, latitude: 52.52 },
			{ name: 'Florencja', countryCode: 'IT', longitude: 11.25, latitude: 43.78 }
		]
	};
}

export function testPlace(name: string, overrides: Partial<MapPlace> = {}): MapPlace {
	return {
		id: `place-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		name,
		placeType: 'museum',
		countryCode: null,
		point: null,
		...overrides
	};
}
