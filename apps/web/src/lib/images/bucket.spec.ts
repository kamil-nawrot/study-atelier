import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	IMAGES_BUCKET,
	OWN_IMAGE_MAX_BYTES,
	OWN_IMAGE_TYPES,
	isOwnImageType,
	ownImageFormats
} from './bucket.ts';

const migration = readFileSync(
	new URL(
		'../../../../../supabase/migrations/20261010234500_artwork_collection.sql',
		import.meta.url
	),
	'utf8'
);

function bucketSettings(): { id: string; sizeLimit: number; types: string[] } {
	const match = migration.match(
		/insert into storage\.buckets[^;]*?values\s*\(\s*'([^']+)',\s*'[^']+',\s*\w+,\s*(\d+),\s*array\[([^\]]*)\]/
	);
	if (!match) throw new Error('The migration has no artwork images bucket');
	return {
		id: match[1],
		sizeLimit: Number(match[2]),
		types: [...match[3].matchAll(/'([^']+)'/g)].map((type) => type[1])
	};
}

describe('artwork images bucket', () => {
	it('uses the bucket, size limit and image types set in the migration', () => {
		const settings = bucketSettings();

		expect(IMAGES_BUCKET).toBe(settings.id);
		expect(OWN_IMAGE_MAX_BYTES).toBe(settings.sizeLimit);
		expect(OWN_IMAGE_TYPES).toEqual(settings.types);
	});

	it('tells the allowed image types from others', () => {
		expect(isOwnImageType('image/png')).toBe(true);
		expect(isOwnImageType('image/heic')).toBe(false);
		expect(isOwnImageType('toString')).toBe(false);
	});

	it('lists the allowed formats by their common names', () => {
		expect(ownImageFormats()).toBe('JPG, PNG, WebP, GIF lub AVIF');
	});
});
