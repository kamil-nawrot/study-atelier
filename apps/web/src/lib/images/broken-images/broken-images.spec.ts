import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveImageCheck } from '#lib/images/broken-images-data/broken-images-data.ts';
import { fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { checkCommonsImages, forgetReportedImages, reportImageCheck } from './broken-images.ts';

vi.mock('#lib/images/broken-images-data/broken-images-data.ts', () => ({
	saveImageCheck: vi.fn().mockResolvedValue(true)
}));

vi.mock('#lib/images/commons/commons.ts', () => ({
	COMMONS_THUMBNAIL_WIDTHS: [250],
	fetchCommonsThumbnails: vi.fn()
}));

const broken = { id: 'image-1', column: 'own_image_path' as const, value: 'a.jpg', broken: true };

function commons(file: string, extra: Partial<ArtworkImageInput> = {}): ArtworkImageInput {
	return {
		kind: 'commons',
		id: `id-${file}`,
		wikidataId: 'Q1',
		file,
		licence: null,
		licenceUrl: null,
		attribution: null,
		width: null,
		height: null,
		...extra
	} as ArtworkImageInput;
}

describe('reportImageCheck', () => {
	beforeEach(() => {
		forgetReportedImages();
		vi.mocked(saveImageCheck).mockClear();
	});
	afterEach(() => vi.unstubAllGlobals());

	it('saves only a change of the state, once a session', () => {
		reportImageCheck(broken, true);
		expect(saveImageCheck).not.toHaveBeenCalled();
		reportImageCheck(broken, false);
		reportImageCheck(broken, false);
		expect(saveImageCheck).toHaveBeenCalledOnce();
		reportImageCheck({ ...broken, broken: false }, true);
		expect(saveImageCheck).toHaveBeenCalledTimes(2);
	});

	it('marks nothing broken while the device is offline', () => {
		vi.stubGlobal('navigator', { onLine: false });
		reportImageCheck(broken, false);
		expect(saveImageCheck).not.toHaveBeenCalled();
		reportImageCheck({ ...broken, broken: false }, true);
		expect(saveImageCheck).toHaveBeenCalledOnce();
	});
});

describe('checkCommonsImages', () => {
	beforeEach(() => {
		forgetReportedImages();
		vi.mocked(saveImageCheck).mockClear();
	});

	it('marks a file Commons does not have and clears one that is back', async () => {
		vi.mocked(fetchCommonsThumbnails).mockImplementation(async (_files, _width, missing) => {
			missing?.add('Gone.jpg');
			return new Map([['Back.jpg', 'https://thumb.example/back.jpg']]);
		});
		await checkCommonsImages([
			commons('Gone.jpg'),
			commons('Back.jpg', { broken: true }),
			commons('Unknown.jpg'),
			null
		]);
		expect(vi.mocked(saveImageCheck).mock.calls.map(([check]) => check)).toEqual([
			{ id: 'id-Gone.jpg', column: 'source_image_file', value: 'Gone.jpg', broken: true },
			{ id: 'id-Back.jpg', column: 'source_image_file', value: 'Back.jpg', broken: false }
		]);
	});

	it('asks Commons nothing without a Commons image', async () => {
		vi.mocked(fetchCommonsThumbnails).mockClear();
		await checkCommonsImages([
			null,
			{ kind: 'url', url: 'https://a.test/a.jpg', width: 1, height: 1 }
		]);
		expect(fetchCommonsThumbnails).not.toHaveBeenCalled();
	});
});
