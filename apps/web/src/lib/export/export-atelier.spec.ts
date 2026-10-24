import { unzipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { downloadOwnImage, readAtelier } from './export-data.ts';
import { exportAtelier } from './export-atelier.ts';
import type { ExportProgress } from './format.ts';

vi.mock('./export-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('./export-data.ts')>()),
	readAtelier: vi.fn(),
	downloadOwnImage: vi.fn()
}));

const now = new Date(2026, 9, 23);

beforeEach(() => vi.clearAllMocks());

describe('exportAtelier', () => {
	it('packs the data and the own images and reports the steps', async () => {
		vi.mocked(readAtelier).mockResolvedValue({
			data: { artworks: [{ id: 'a', own_image_path: 'u/a.jpg' }] }
		});
		vi.mocked(downloadOwnImage).mockImplementation(async (path) =>
			path === 'u/a-thumb.jpg' ? { missing: true } : { bytes: new Uint8Array([1]) }
		);
		const steps: ExportProgress[] = [];

		const result = await exportAtelier((step) => steps.push(step), now);

		if (result.error !== undefined) throw new Error(result.error);
		expect(result.name).toBe('study-atelier-2026-10-23.zip');
		expect(Object.keys(unzipSync(new Uint8Array(await result.blob.arrayBuffer()))).sort()).toEqual([
			'atelier.json',
			'images/u/a.jpg'
		]);
		expect(steps[0]).toEqual({ step: 'data' });
		expect(steps).toContainEqual({ step: 'images', done: 2, total: 2 });
		expect(steps.at(-1)).toEqual({ step: 'archive' });
	});

	it('gives up instead of leaving out an image it could not download', async () => {
		vi.mocked(readAtelier).mockResolvedValue({
			data: { artworks: [{ id: 'a', own_image_path: 'u/a.jpg' }] }
		});
		vi.mocked(downloadOwnImage).mockResolvedValue({ error: { status: 500 } });

		expect(await exportAtelier(() => undefined, now)).toEqual({
			error: m.settings.data.imageFailed
		});
	});

	it('returns the error of a table that cannot be read', async () => {
		vi.mocked(readAtelier).mockResolvedValue({ error: m.settings.data.failed });

		expect(await exportAtelier(() => undefined, now)).toEqual({ error: m.settings.data.failed });
	});
});
