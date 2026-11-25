import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

export const MIN_IMAGE_SIDE = 1000;
const ARTWORK_TYPES = new Set([
	'architecture',
	'painting',
	'sculpture',
	'drawing',
	'printmaking',
	'applied_arts',
	'photography',
	'other'
]);
const PLACE_TYPES = new Set(['museum', 'gallery', 'private_collection', 'on_site']);
const ERA_BOUNDS = { prehistory: [-40000, -3000] };

function keyed(list, label, problems) {
	const map = new Map();
	for (const item of list ?? []) {
		if (map.has(item.key)) problems.push(`${label} "${item.key}" is listed twice`);
		map.set(item.key, item);
	}
	return map;
}

export function validatePack(pack) {
	const problems = [];
	const periods = keyed(pack.periods, 'period', problems);
	const materials = keyed(pack.materials, 'material', problems);
	const cities = keyed(pack.cities, 'city', problems);
	const places = keyed(pack.places, 'place', problems);
	for (const city of cities.values()) {
		if (!/^Q\d+$/.test(city.wikidata ?? '')) problems.push(`city "${city.key}" has no Wikidata id`);
		if (!/^[A-Z]{2}$/.test(city.country ?? '')) problems.push(`city "${city.key}" has no country`);
		if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
			problems.push(`city "${city.key}" has no position`);
		}
	}
	for (const place of places.values()) {
		if (!PLACE_TYPES.has(place.type)) problems.push(`place "${place.key}" has an unknown type`);
		if (!cities.has(place.city)) problems.push(`place "${place.key}" has no known city`);
	}
	const titles = new Set();
	const wikidataIds = new Set();
	for (const artwork of pack.artworks ?? []) {
		const name = artwork.title;
		if (titles.has(name)) problems.push(`"${name}" is listed twice`);
		titles.add(name);
		if (wikidataIds.has(artwork.wikidata)) problems.push(`"${name}" repeats ${artwork.wikidata}`);
		wikidataIds.add(artwork.wikidata);
		if (!ARTWORK_TYPES.has(artwork.type)) problems.push(`"${name}" has an unknown type`);
		const { from, to } = artwork.year ?? {};
		if (!Number.isInteger(to) || to === 0) problems.push(`"${name}" has no year`);
		if (from !== undefined && !(Number.isInteger(from) && from !== 0 && from < to)) {
			problems.push(`"${name}" has a wrong range of years`);
		}
		const bounds = ERA_BOUNDS[pack.era];
		if (bounds && ((from ?? to) < bounds[0] || to > bounds[1])) {
			problems.push(`"${name}" lies outside the default bounds of the era ${pack.era}`);
		}
		for (const key of artwork.periods ?? []) {
			if (!periods.has(key)) problems.push(`"${name}" has an unknown period "${key}"`);
		}
		for (const key of artwork.materials ?? []) {
			if (!materials.has(key)) problems.push(`"${name}" has an unknown material "${key}"`);
		}
		if (!places.has(artwork.place)) problems.push(`"${name}" has an unknown place`);
		const image = artwork.image;
		if (!image?.file || !image.licence || !image.attribution) {
			problems.push(`"${name}" has no image with a licence and an attribution`);
		} else if (Math.min(image.width, image.height) < MIN_IMAGE_SIDE) {
			problems.push(`"${name}" has an image under ${MIN_IMAGE_SIDE} px`);
		}
	}
	return problems;
}

export function buildAtelier(pack, newId = randomUUID) {
	const data = {
		artworks: [],
		artwork_images: [],
		category_values: [],
		artwork_values: [],
		period_eras: [],
		period_details: [],
		location_details: []
	};
	const valueIds = new Map();
	const addValue = (category, key, name) => {
		const id = newId();
		valueIds.set(key, id);
		data.category_values.push({ id, category_code: category, name });
		return id;
	};

	for (const period of pack.periods) {
		const id = addValue('period', `period:${period.key}`, period.name);
		data.period_details.push({ value_id: id, category_code: 'period', summary: period.summary });
		data.period_eras.push({ value_id: id, era_code: pack.era });
	}
	for (const material of pack.materials) {
		addValue('material', `material:${material.key}`, material.name);
	}

	const place = (row) => ({
		place_type: null,
		country_code: null,
		latitude: null,
		longitude: null,
		wikidata_id: null,
		catalogue_wikidata_id: null,
		city_id: null,
		...row,
		category_code: 'location'
	});
	const cities = new Map(pack.cities.map((city) => [city.key, city]));
	for (const city of pack.cities) {
		const id = addValue('location', `city:${city.key}`, city.name);
		data.location_details.push(
			place({
				value_id: id,
				place_type: 'city',
				country_code: city.country,
				latitude: city.latitude,
				longitude: city.longitude,
				wikidata_id: city.wikidata
			})
		);
	}
	for (const museum of pack.places) {
		const id = addValue('location', `location:${museum.key}`, museum.name);
		data.location_details.push(
			place({
				value_id: id,
				place_type: museum.type,
				country_code: cities.get(museum.city).country,
				wikidata_id: museum.wikidata,
				catalogue_wikidata_id: museum.catalogue ? museum.wikidata : null,
				city_id: valueIds.get(`city:${museum.city}`)
			})
		);
	}
	for (const artwork of pack.artworks) {
		const id = newId();
		data.artworks.push({
			id,
			title: artwork.title,
			author_unknown: true,
			year_from: artwork.year.from ?? null,
			year_to: artwork.year.to,
			year_approximate: artwork.year.approximate === true,
			type_code: artwork.type,
			era_code: pack.era,
			notes: artwork.note ?? null
		});
		data.artwork_images.push({
			id: newId(),
			artwork_id: id,
			position: 0,
			source_wikidata_id: artwork.wikidata,
			source_image_file: artwork.image.file,
			source_image_licence: artwork.image.licence,
			source_image_licence_url: artwork.image.licenceUrl ?? null,
			source_image_attribution: artwork.image.attribution,
			image_width: artwork.image.width,
			image_height: artwork.image.height
		});
		const values = [
			...artwork.periods.map((key) => `period:${key}`),
			...artwork.materials.map((key) => `material:${key}`),
			`location:${artwork.place}`
		];
		const positions = new Map();
		for (const value of values) {
			const category = value.slice(0, value.indexOf(':'));
			const position = positions.get(category) ?? 0;
			positions.set(category, position + 1);
			data.artwork_values.push({ artwork_id: id, value_id: valueIds.get(value), position });
		}
	}
	return data;
}

export function atelierFile(data, now) {
	return { format: 'study-atelier', version: 1, exportedAt: now.toISOString(), data };
}

export function storedZip(entries) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const { name, bytes } of entries) {
		const nameBytes = Buffer.from(name, 'utf8');
		const crc = crc32(bytes);
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(0x0800, 6);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(bytes.length, 18);
		local.writeUInt32LE(bytes.length, 22);
		local.writeUInt16LE(nameBytes.length, 26);
		locals.push(local, nameBytes, bytes);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt16LE(0x0800, 8);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(bytes.length, 20);
		central.writeUInt32LE(bytes.length, 24);
		central.writeUInt16LE(nameBytes.length, 28);
		central.writeUInt32LE(offset, 42);
		centrals.push(central, nameBytes);
		offset += local.length + nameBytes.length + bytes.length;
	}
	const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(centralSize, 12);
	end.writeUInt32LE(offset, 16);
	return Buffer.concat([...locals, ...centrals, end]);
}

function main(args) {
	const [folder, outFlag, outFolder] = args;
	if (!folder) {
		console.error('Usage: node tools/packs/build-pack.mjs <pack folder> [--out <folder>]');
		return 2;
	}
	const pack = JSON.parse(readFileSync(join(folder, 'pack.json'), 'utf8'));
	const problems = validatePack(pack);
	if (problems.length > 0) {
		for (const problem of problems) console.error(`- ${problem}`);
		return 1;
	}
	const out = outFlag === '--out' && outFolder ? outFolder : join('tmp', 'packs');
	mkdirSync(out, { recursive: true });
	const json = JSON.stringify(atelierFile(buildAtelier(pack), new Date()), null, '\t');
	const target = resolve(out, `study-atelier-pack-${pack.slug}.zip`);
	writeFileSync(target, storedZip([{ name: 'atelier.json', bytes: Buffer.from(json, 'utf8') }]));
	console.log(`${pack.artworks.length} artworks → ${target}`);
	return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	process.exitCode = main(process.argv.slice(2));
}
