import { strToU8, zipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FORMAT_NAME, FORMAT_VERSION } from '#lib/data-transfer/format/format.ts';
import { m } from '#lib/i18n/i18n.ts';
import { importArchive } from './import-atelier.ts';
import type { ImportProgress } from '#lib/data-transfer/types/import-progress.ts';
import {
	currentOwnerId,
	importAtelier,
	removeUploads,
	uploadImport
} from '#lib/data-transfer/import-data/import-data.ts';
import { loadStorageUsage } from '#lib/images/storage-usage-data/storage-usage-data.ts';

vi.mock('#lib/images/storage-usage-data/storage-usage-data.ts', () => ({
	loadStorageUsage: vi.fn()
}));

vi.mock('#lib/data-transfer/import-data/import-data.ts', () => ({
	currentOwnerId: vi.fn(),
	importAtelier: vi.fn(),
	removeUploads: vi.fn(),
	uploadImport: vi.fn()
}));

const OWNER = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function archive(): Blob {
	const file = {
		format: FORMAT_NAME,
		version: FORMAT_VERSION,
		exportedAt: '',
		data: {
			artworks: [{ id: '11111111-1111-4111-8111-111111111111', own_image_path: 'old/a.jpg' }]
		}
	};
	return new Blob([
		zipSync({
			'atelier.json': strToU8(JSON.stringify(file)),
			'images/old/a.jpg': new Uint8Array([1])
		}) as Uint8Array<ArrayBuffer>
	]);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(currentOwnerId).mockResolvedValue(OWNER);
	vi.mocked(uploadImport).mockResolvedValue(true);
	vi.mocked(importAtelier).mockResolvedValue({});
	vi.mocked(loadStorageUsage).mockResolvedValue(undefined);
});

describe('importArchive', () => {
	it('uploads the own files, then imports the rows and reports the steps', async () => {
		const steps: ImportProgress[] = [];

		const result = await importArchive(archive(), (step) => steps.push(step));

		expect(result).toEqual({ imported: true });
		expect(uploadImport).toHaveBeenCalledOnce();
		const payload = vi.mocked(importAtelier).mock.calls[0][0];
		expect(payload.artworks[0].own_image_path).toBe(vi.mocked(uploadImport).mock.calls[0][0].path);
		expect(steps[0]).toEqual({ step: 'reading' });
		expect(steps.at(-1)).toEqual({ step: 'saving' });
	});

	it('says why a file cannot be read and uploads nothing', async () => {
		const result = await importArchive(new Blob(['nope']), () => undefined);

		expect(result).toEqual({ error: m.settings.data.importNotZip });
		expect(uploadImport).not.toHaveBeenCalled();
	});

	it('uploads nothing when the images do not fit in the space left', async () => {
		vi.mocked(loadStorageUsage).mockResolvedValue({ usedBytes: 100, quotaBytes: 100 });

		const result = await importArchive(archive(), () => undefined);

		expect(result).toEqual({ error: m.settings.data.importLimit });
		expect(uploadImport).not.toHaveBeenCalled();
	});

	it('removes the uploaded files when the import is refused', async () => {
		vi.mocked(importAtelier).mockResolvedValue({
			error: m.settings.data.importNotEmpty,
			notEmpty: true
		});

		const result = await importArchive(archive(), () => undefined);

		expect(result).toEqual({ error: m.settings.data.importNotEmpty, notEmpty: true });
		expect(removeUploads).toHaveBeenCalledWith([vi.mocked(uploadImport).mock.calls[0][0].path]);
	});

	it('removes what it uploaded when a file cannot be uploaded', async () => {
		vi.mocked(uploadImport).mockResolvedValue(false);

		const result = await importArchive(archive(), () => undefined);

		expect(result).toEqual({ error: m.settings.data.importFailed });
		expect(importAtelier).not.toHaveBeenCalled();
	});
});
