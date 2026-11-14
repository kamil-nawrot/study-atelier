import type { FeatureCollection, MultiLineString } from 'geojson';

export type Geography = {
	land: FeatureCollection;
	borders: MultiLineString;
};
