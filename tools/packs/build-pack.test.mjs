import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildAtelier, storedZip, validatePack } from './build-pack.mjs';

const PACKS = join(import.meta.dirname, '..', '..', 'content', 'packs');

function loadPack(slug) {
	return JSON.parse(readFileSync(join(PACKS, slug, 'pack.json'), 'utf8'));
}

function counter() {
	let next = 0;
	return () => `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`;
}

const SMALL_PACK = {
	slug: 'test',
	era: 'prehistory',
	periods: [{ key: 'gravettian', name: 'kultura grawecka', summary: 'Kultura.' }],
	materials: [{ key: 'limestone', name: 'wapień' }],
	cities: [
		{
			key: 'vienna',
			name: 'Wiedeń',
			wikidata: 'Q1741',
			country: 'AT',
			latitude: 48.2,
			longitude: 16.4
		}
	],
	places: [{ key: 'nhm', name: 'Muzeum', type: 'museum', wikidata: 'Q688704', city: 'vienna' }],
	artworks: [
		{
			wikidata: 'Q131397',
			title: 'Wenus z Willendorfu',
			type: 'sculpture',
			year: { to: -28000, approximate: true },
			periods: ['gravettian'],
			materials: ['limestone'],
			place: 'nhm',
			image: { file: 'a.jpg', width: 1428, height: 2684, licence: 'CC BY 2.5', attribution: 'X' },
			note: 'Notatka.'
		}
	]
};

test('every pack in content/packs is valid', () => {
	for (const entry of readdirSync(PACKS, { withFileTypes: true }).filter((item) =>
		item.isDirectory()
	)) {
		const slug = entry.name;
		assert.deepEqual(validatePack(loadPack(slug)), [], slug);
	}
});

test('a small image, an unknown place and a year outside the era are reported', () => {
	const artwork = {
		...SMALL_PACK.artworks[0],
		place: 'louvre',
		year: { to: -45000 },
		image: { ...SMALL_PACK.artworks[0].image, width: 999 }
	};
	assert.deepEqual(validatePack({ ...SMALL_PACK, artworks: [artwork] }), [
		'"Wenus z Willendorfu" lies outside the default bounds of the era prehistory',
		'"Wenus z Willendorfu" has an unknown place',
		'"Wenus z Willendorfu" has an image under 1000 px'
	]);
});

test('the atelier links the artwork to its values and the museum to its city', () => {
	const data = buildAtelier(SMALL_PACK, counter());
	const [artwork] = data.artworks;
	assert.equal(artwork.year_from, null);
	assert.equal(artwork.year_to, -28000);
	assert.equal(artwork.era_code, 'prehistory');
	assert.equal(data.artwork_images[0].source_wikidata_id, 'Q131397');
	const names = Object.fromEntries(data.category_values.map((value) => [value.id, value]));
	assert.deepEqual(
		data.artwork_values.map((row) => [names[row.value_id].name, row.position]),
		[
			['kultura grawecka', 0],
			['wapień', 0],
			['Muzeum', 0]
		]
	);
	const [city, museum] = data.location_details;
	assert.equal(city.place_type, 'city');
	assert.equal(names[city.value_id].category_code, 'location');
	assert.equal(museum.city_id, city.value_id);
	assert.equal(museum.latitude, null);
	assert.equal(museum.country_code, 'AT');
	assert.deepEqual(data.period_eras, [
		{ value_id: names[data.period_details[0].value_id].id, era_code: 'prehistory' }
	]);
});

test('the zip stores the file under its name', () => {
	const bytes = Buffer.from('{"a":1}', 'utf8');
	const zip = storedZip([{ name: 'atelier.json', bytes }]);
	assert.equal(zip.readUInt32LE(0), 0x04034b50);
	assert.equal(zip.toString('utf8', 30, 42), 'atelier.json');
	assert.equal(zip.toString('utf8', 42, 42 + bytes.length), '{"a":1}');
	assert.equal(zip.readUInt32LE(zip.length - 22), 0x06054b50);
});
