import type { FeatureCollection, MultiLineString } from 'geojson';
import type { Town } from './town.ts';

export type Geography = {
	land: FeatureCollection;
	borders: MultiLineString;
	towns: Town[];
};
