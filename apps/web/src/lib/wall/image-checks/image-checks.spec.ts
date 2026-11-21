import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { checkedOwnImageUrls, ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { imageChecks, wallImageUrls } from './image-checks.ts';

vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({
	ownImageUrls: vi.fn(),
	checkedOwnImageUrls: vi.fn()
}));

vi.mock('#lib/images/thumbnail-backfill/thumbnail-backfill.ts', () => ({
	backfillThumbnails: vi.fn()
}));

const answers = {
	thumbnails: new Map([['Fine.jpg', 'https://thumb.example/fine.jpg']]),
	missingFiles: new Set(['Gone.jpg']),
	urls: new Map([['owner/fine.jpg', 'https://signed.example/fine.jpg']]),
	missingPaths: ['owner/gone.jpg']
};

describe('imageChecks', () => {
	it('checks the main images that the sources answered about', () => {
		const checks = imageChecks(
			[
				testArtwork(1, 'Gone', { imageId: 'i1', pendingImage: { sourceFile: 'Gone.jpg' } }),
				testArtwork(2, 'Fine', {
					imageId: 'i2',
					imageBroken: true,
					pendingImage: { sourceFile: 'Fine.jpg' }
				}),
				testArtwork(3, 'Unknown', { imageId: 'i3', pendingImage: { sourceFile: 'Other.jpg' } }),
				testArtwork(4, 'Own gone', { imageId: 'i4', pendingImage: { ownPath: 'owner/gone.jpg' } }),
				testArtwork(5, 'Own fine', { imageId: 'i5', ownImagePath: 'owner/fine.jpg' }),
				testArtwork(6, 'No id', { pendingImage: { sourceFile: 'Gone.jpg' } })
			],
			answers
		);
		expect(checks).toEqual([
			{
				check: { id: 'i1', column: 'source_image_file', value: 'Gone.jpg', broken: true },
				wasBroken: false
			},
			{
				check: { id: 'i2', column: 'source_image_file', value: 'Fine.jpg', broken: false },
				wasBroken: true
			},
			{
				check: { id: 'i4', column: 'own_image_path', value: 'owner/gone.jpg', broken: true },
				wasBroken: false
			},
			{
				check: { id: 'i5', column: 'own_image_path', value: 'owner/fine.jpg', broken: false },
				wasBroken: false
			}
		]);
	});
});

describe('wallImageUrls', () => {
	it('signs the small copies first and names the originals storage does not have', async () => {
		vi.mocked(ownImageUrls).mockResolvedValue(
			new Map([['owner/a-thumb.jpg', 'https://signed.example/a-small.jpg']])
		);
		vi.mocked(checkedOwnImageUrls).mockResolvedValue({
			urls: new Map([['owner/b.jpg', 'https://signed.example/b.jpg']]),
			missing: ['owner/c.jpg']
		});
		const result = await wallImageUrls(['owner/a.jpg', 'owner/b.jpg', 'owner/c.jpg']);
		expect(checkedOwnImageUrls).toHaveBeenCalledWith(['owner/b.jpg', 'owner/c.jpg']);
		expect(result.missing).toEqual(['owner/c.jpg']);
		expect(result.urls.get('owner/b.jpg')).toBe('https://signed.example/b.jpg');
	});
});
