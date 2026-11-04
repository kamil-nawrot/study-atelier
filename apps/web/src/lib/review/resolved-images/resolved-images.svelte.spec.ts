import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { resolveImages } from '#lib/wall/wall-data/wall-data.ts';
import { ResolvedImages } from './resolved-images.svelte.ts';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ resolveImages: vi.fn() }));

describe('ResolvedImages', () => {
	it('resolves only the artworks with a pending image and keeps what it found', async () => {
		const pending = testArtwork(1, 'Pending', { pendingImage: { sourceFile: 'Work.jpg' } });
		const ready = testArtwork(2, 'Ready');
		const found = { ...pending, pendingImage: undefined, imageUnavailable: false };
		vi.mocked(resolveImages).mockResolvedValue([found]);
		const images = new ResolvedImages();

		await images.resolve([pending, ready]);

		expect(resolveImages).toHaveBeenCalledWith([pending]);
		expect(images.withImage(pending)).toBe(found);
		expect(images.withImage(ready)).toBe(ready);
	});

	it('asks for nothing when no image is pending', async () => {
		vi.mocked(resolveImages).mockClear();

		await new ResolvedImages().resolve([testArtwork(3, 'Ready')]);

		expect(resolveImages).not.toHaveBeenCalled();
	});
});
