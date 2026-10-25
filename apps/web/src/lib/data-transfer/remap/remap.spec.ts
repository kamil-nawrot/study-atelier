import { describe, expect, it } from 'vitest';
import { remapAtelier } from './remap.ts';

const OWNER = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const OLD_OWNER = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const ARTWORK = '11111111-1111-4111-8111-111111111111';
const AUTHOR = '22222222-2222-4222-8222-222222222222';
const FIELD = '33333333-3333-4333-8333-333333333333';

function counter(): () => string {
	let next = 0;
	return () => `00000000-0000-4000-8000-${String(++next).padStart(12, '0')}`;
}

const data = {
	artworks: [
		{
			id: ARTWORK,
			record_number: 7,
			notes: `[Vermeer](/atelier/values/author/${AUTHOR}) and [#0003](/atelier/3)`,
			own_image_path: `${OLD_OWNER}/old.jpg`
		}
	],
	category_values: [
		{ id: AUTHOR, category_code: 'author', name: 'Vermeer' },
		{ id: '44444444-4444-4444-8444-444444444444', category_code: FIELD, name: 'Lecture' }
	],
	artwork_fields: [{ id: FIELD, name: 'Lecture' }],
	artwork_values: [{ artwork_id: ARTWORK, value_id: AUTHOR }],
	review_log: [{ id: 12, artwork_id: ARTWORK }]
};

describe('remapAtelier', () => {
	it('gives every record a new id and keeps the references between them', () => {
		const { payload } = remapAtelier(data, new Map(), OWNER, counter());

		const artwork = payload.artworks[0];
		const author = payload.category_values[0];
		expect(artwork.id).not.toBe(ARTWORK);
		expect(author.id).not.toBe(AUTHOR);
		expect(payload.artwork_values[0]).toEqual({ artwork_id: artwork.id, value_id: author.id });
		expect(payload.review_log[0]).toEqual({ id: 12, artwork_id: artwork.id });
	});

	it('follows a field in the category of its values', () => {
		const { payload } = remapAtelier(data, new Map(), OWNER, counter());

		expect(payload.category_values[1].category_code).toBe(payload.artwork_fields[0].id);
		expect(payload.category_values[0].category_code).toBe('author');
	});

	it('rewrites the links to values in notes and keeps the links to artworks', () => {
		const { payload } = remapAtelier(data, new Map(), OWNER, counter());

		expect(payload.artworks[0].notes).toBe(
			`[Vermeer](/atelier/values/author/${payload.category_values[0].id}) and [#0003](/atelier/3)`
		);
		expect(payload.artworks[0].record_number).toBe(7);
	});

	it('moves own files to the new owner with their thumbnails', () => {
		const images = new Map([
			[`${OLD_OWNER}/old.jpg`, new Uint8Array([1])],
			[`${OLD_OWNER}/old-thumb.jpg`, new Uint8Array([2])]
		]);

		const { payload, uploads } = remapAtelier(data, images, OWNER, counter());

		const path = payload.artworks[0].own_image_path as string;
		expect(path.startsWith(`${OWNER}/`)).toBe(true);
		expect(path.endsWith('.jpg')).toBe(true);
		expect(uploads.map((upload) => upload.path)).toEqual([
			path,
			path.replace('.jpg', '-thumb.jpg')
		]);
		expect(uploads[0].contentType).toBe('image/jpeg');
	});

	it('does not upload a file that is not in the archive', () => {
		const { uploads } = remapAtelier(data, new Map(), OWNER, counter());

		expect(uploads).toEqual([]);
	});

	it('shares one new path between rows that point at the same file', () => {
		const shared = {
			artworks: [{ id: ARTWORK, own_image_path: `${OLD_OWNER}/old.png` }],
			artwork_images: [{ id: AUTHOR, artwork_id: ARTWORK, own_image_path: `${OLD_OWNER}/old.png` }]
		};

		const { payload, uploads } = remapAtelier(
			shared,
			new Map([[`${OLD_OWNER}/old.png`, new Uint8Array([1])]]),
			OWNER,
			counter()
		);

		expect(payload.artwork_images[0].own_image_path).toBe(payload.artworks[0].own_image_path);
		expect(uploads).toHaveLength(1);
		expect(uploads[0].contentType).toBe('image/png');
	});

	it('leaves out the tables the import does not take', () => {
		const { payload } = remapAtelier(
			{ ...data, profiles: [{ display_name: 'A' }] },
			new Map(),
			OWNER
		);

		expect(payload).not.toHaveProperty('profiles');
		expect(payload).not.toHaveProperty('categories');
	});
});
