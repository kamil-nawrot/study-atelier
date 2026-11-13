import { asset } from '$app/paths';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';
import type { Geography } from '#lib/map/types/geography.ts';
import type { Town } from '#lib/map/types/town.ts';

type World = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

type TownRow = [number, number, string, string];

let loading: Promise<Geography> | undefined;

async function json<T>(path: string): Promise<T> {
	const response = await fetch(path);
	if (!response.ok) throw new Error(`${path} answered ${response.status}`);
	return response.json();
}

export function townsOf(rows: TownRow[]): Town[] {
	return rows.map(([longitude, latitude, name, countryCode]) => ({
		name,
		countryCode,
		longitude,
		latitude
	}));
}

export function geographyOf(world: World, rows: TownRow[]): Geography {
	return {
		land: feature(world, world.objects.land) as FeatureCollection,
		borders: mesh(world, world.objects.countries, (first, second) => first !== second),
		towns: townsOf(rows)
	};
}

export function loadGeography(): Promise<Geography> {
	loading ??= Promise.all([
		json<World>(asset('map/world.json')),
		json<TownRow[]>(asset('map/towns.json'))
	])
		.then(([world, rows]) => geographyOf(world, rows))
		.catch((error: unknown) => {
			loading = undefined;
			throw error;
		});
	return loading;
}
