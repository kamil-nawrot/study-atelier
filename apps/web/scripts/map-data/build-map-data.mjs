import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const PLACES_URL =
	'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_populated_places.geojson';
const OUT = new URL('../../static/map/', import.meta.url);

const require = createRequire(import.meta.url);
const world = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
writeFileSync(new URL('world.json', OUT), JSON.stringify(world));

const response = await fetch(PLACES_URL, {
	headers: { 'User-Agent': 'study-atelier (https://github.com/kamil-nawrot/study-atelier)' }
});
if (!response.ok) throw new Error(`Natural Earth answered ${response.status}`);
const places = await response.json();
const round = (value) => Math.round(value * 1000) / 1000;
const towns = places.features
	.map(({ properties: town, geometry }) => [
		round(geometry.coordinates[0]),
		round(geometry.coordinates[1]),
		town.NAME_PL || town.NAME,
		town.ISO_A2 === '-99' ? town.ADM0_A3 : town.ISO_A2
	])
	.sort((first, second) => first[0] - second[0]);
writeFileSync(new URL('towns.json', OUT), JSON.stringify(towns));
console.log(`world.json and ${towns.length} towns written`);
