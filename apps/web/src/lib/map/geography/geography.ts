import { asset } from '$app/paths';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';
import type { Geography } from '#lib/map/types/geography.ts';
import type { Town } from '#lib/map/types/town.ts';

type World = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

type TownRow = [number, number, string, string, string?, string?, string?, string?];

let loading: Promise<Geography> | undefined;
let loadingTowns: Promise<Town[]> | undefined;

async function json<T>(path: string): Promise<T> {
	const response = await fetch(path);
	if (!response.ok) throw new Error(`${path} answered ${response.status}`);
	return response.json();
}

export function townsOf(rows: TownRow[]): Town[] {
	return rows.map(([longitude, latitude, name, countryCode, wikidataId, region, ...names]) => {
		const otherNames = names.filter((other): other is string => Boolean(other));
		return {
			name,
			countryCode,
			longitude,
			latitude,
			...(wikidataId ? { wikidataId } : {}),
			...(region ? { region } : {}),
			...(otherNames.length > 0 ? { otherNames } : {})
		};
	});
}

export function geographyOf(world: World): Geography {
	return {
		land: feature(world, world.objects.land) as FeatureCollection,
		borders: mesh(world, world.objects.countries, (first, second) => first !== second)
	};
}

export function loadGeography(): Promise<Geography> {
	loading ??= json<World>(asset('map/world.json'))
		.then(geographyOf)
		.catch((error: unknown) => {
			loading = undefined;
			throw error;
		});
	return loading;
}

export function loadTowns(): Promise<Town[]> {
	loadingTowns ??= json<TownRow[]>(asset('map/towns.json'))
		.then(townsOf)
		.catch((error: unknown) => {
			loadingTowns = undefined;
			throw error;
		});
	return loadingTowns;
}
