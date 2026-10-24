import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { FORMAT_NAME, FORMAT_VERSION } from '#lib/export/format.ts';
import { parseArchive } from './parse.ts';

function archive(file: unknown, extra: Record<string, Uint8Array> = {}): Uint8Array {
	return zipSync({ 'atelier.json': strToU8(JSON.stringify(file)), ...extra });
}

const valid = {
	format: FORMAT_NAME,
	version: FORMAT_VERSION,
	exportedAt: '2026-10-23T12:00:00.000Z',
	data: { artworks: [{ id: 'a', title: 'Mona Lisa' }] }
};

describe('parseArchive', () => {
	it('reads the data and the image files', () => {
		const result = parseArchive(archive(valid, { 'images/u/a.jpg': new Uint8Array([1]) }));

		if ('failure' in result) throw new Error(result.failure);
		expect(result.archive.file.data.artworks).toEqual([{ id: 'a', title: 'Mona Lisa' }]);
		expect([...(result.archive.images.get('u/a.jpg') ?? [])]).toEqual([1]);
	});

	it('refuses what is not a ZIP', () => {
		expect(parseArchive(strToU8('not a zip'))).toEqual({ failure: 'notZip' });
	});

	it('refuses a ZIP without the data file', () => {
		expect(parseArchive(zipSync({ 'other.txt': strToU8('x') }))).toEqual({ failure: 'noData' });
	});

	it('refuses a file that is not an export of the atelier', () => {
		expect(parseArchive(archive({ ...valid, format: 'other' }))).toEqual({ failure: 'notAtelier' });
		expect(parseArchive(archive([]))).toEqual({ failure: 'notAtelier' });
	});

	it('refuses a file from a newer version', () => {
		expect(parseArchive(archive({ ...valid, version: FORMAT_VERSION + 1 }))).toEqual({
			failure: 'newer'
		});
	});

	it('refuses broken JSON and a table that is not a list of rows', () => {
		expect(parseArchive(zipSync({ 'atelier.json': strToU8('{') }))).toEqual({ failure: 'broken' });
		expect(parseArchive(archive({ ...valid, data: { artworks: 'x' } }))).toEqual({
			failure: 'broken'
		});
		expect(parseArchive(archive({ ...valid, version: 'one' }))).toEqual({ failure: 'broken' });
	});
});
