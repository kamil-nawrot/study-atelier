import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { ArchiveBuilder, atelierFile } from './archive.ts';
import {
	archiveName,
	DATA_FILE,
	FORMAT_NAME,
	FORMAT_VERSION
} from '#lib/data-transfer/format/format.ts';

const now = new Date(2026, 9, 23, 14, 5);

describe('archive', () => {
	it('names the file after the local date', () => {
		expect(archiveName(now)).toBe('study-atelier-2026-10-23.zip');
		expect(archiveName(new Date(2026, 0, 5))).toBe('study-atelier-2026-01-05.zip');
	});

	it('describes the format and the moment of the export', () => {
		expect(atelierFile({ artworks: [] }, now)).toEqual({
			format: FORMAT_NAME,
			version: FORMAT_VERSION,
			exportedAt: now.toISOString(),
			data: { artworks: [] }
		});
	});

	it('packs the data and the image files into one ZIP', async () => {
		const archive = new ArchiveBuilder();
		archive.addJson(atelierFile({ artworks: [{ id: 'a', title: 'Mona Lisa' }] }, now));
		archive.addImage({ path: 'owner/one.jpg', bytes: new Uint8Array([1, 2, 3]) });

		const files = unzipSync(new Uint8Array(await archive.finish().arrayBuffer()));

		expect(Object.keys(files).sort()).toEqual([DATA_FILE, 'images/owner/one.jpg']);
		expect(JSON.parse(strFromU8(files[DATA_FILE])).data.artworks[0].title).toBe('Mona Lisa');
		expect([...files['images/owner/one.jpg']]).toEqual([1, 2, 3]);
	});
});
