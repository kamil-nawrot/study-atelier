import { describe, expect, it } from 'vitest';
import { imageColumns, imageOf, imageRecord } from './image-record.ts';

const commons = {
	kind: 'commons' as const,
	wikidataId: 'Q12418',
	file: 'Mona Lisa.jpg',
	licence: 'Public domain',
	licenceUrl: null,
	attribution: 'Leonardo da Vinci',
	width: 800,
	height: 1200
};

describe('imageColumns', () => {
	it('fills the source columns for a Commons image', () => {
		expect(imageColumns(commons)).toEqual({
			source_wikidata_id: 'Q12418',
			source_image_file: 'Mona Lisa.jpg',
			source_image_licence: 'Public domain',
			source_image_licence_url: null,
			source_image_attribution: 'Leonardo da Vinci',
			own_image_path: null,
			own_image_url: null,
			image_width: 800,
			image_height: 1200
		});
	});

	it('fills only the own columns for an uploaded or linked image', () => {
		expect(imageColumns({ kind: 'upload', path: 'a/b.webp', width: 10, height: 20 })).toEqual({
			source_wikidata_id: null,
			source_image_file: null,
			source_image_licence: null,
			source_image_licence_url: null,
			source_image_attribution: null,
			own_image_path: 'a/b.webp',
			own_image_url: null,
			image_width: 10,
			image_height: 20
		});
		expect(
			imageColumns({ kind: 'url', url: 'https://example.org/a.jpg', width: 1, height: 2 })
		).toMatchObject({ own_image_path: null, own_image_url: 'https://example.org/a.jpg' });
	});

	it('fills the licence columns and the album path for an album image', () => {
		expect(
			imageColumns({
				kind: 'album',
				path: 'sample-album/images/spiral.webp',
				wikidataId: 'Q131397',
				licence: 'CC0',
				licenceUrl: null,
				attribution: 'Jane Doe',
				width: 600,
				height: 900
			})
		).toEqual({
			source_wikidata_id: 'Q131397',
			source_image_file: null,
			source_image_licence: 'CC0',
			source_image_licence_url: null,
			source_image_attribution: 'Jane Doe',
			own_image_path: null,
			own_image_url: null,
			album_image_path: 'sample-album/images/spiral.webp',
			image_width: 600,
			image_height: 900
		});
	});

	it('clears every column without an image', () => {
		expect(Object.values(imageColumns(null)).every((value) => value === null)).toBe(true);
	});

	it('reads back the image it stored', () => {
		expect(imageOf(imageRecord({ ...commons, id: 'image-1' }))).toEqual({
			...commons,
			id: 'image-1'
		});
	});

	it('reads back an album image it stored', () => {
		const album = {
			kind: 'album' as const,
			path: 'sample-album/images/spiral.webp',
			wikidataId: null,
			licence: 'CC BY-SA 4.0',
			licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
			attribution: 'Jane Doe',
			width: 600,
			height: 900
		};
		expect(imageOf(imageRecord({ ...album, id: 'image-2' }))).toEqual({ ...album, id: 'image-2' });
	});
});
