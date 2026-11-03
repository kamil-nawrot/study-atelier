import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import { noteWrite } from '#lib/shared/data/writes/writes.ts';
import { PRELOAD_LIFETIME_MS, artworkCore, preloadArtwork } from './artwork-preload.ts';

vi.mock('#lib/artworks/artwork-data/artwork-data.ts', () => ({ loadArtwork: vi.fn() }));

function loaded(title: string): { artwork: { title: string } } {
	return { artwork: { title } };
}

describe('artwork preload', () => {
	beforeEach(() => {
		noteWrite();
		vi.mocked(loadArtwork)
			.mockReset()
			.mockImplementation(async (number) => loaded(`Artwork ${number}`) as never);
	});

	it('reads the next artwork once and hands that read to its opening', async () => {
		preloadArtwork(30, 1000);
		preloadArtwork(30, 2000);

		await expect(artworkCore(30, 3000)).resolves.toEqual(loaded('Artwork 30'));
		expect(loadArtwork).toHaveBeenCalledExactlyOnceWith(30);
	});

	it('reads the artwork again once the preload was used, is old or was for another one', async () => {
		preloadArtwork(30, 1000);
		await artworkCore(30, 1000);
		await artworkCore(30, 1000);

		preloadArtwork(31, 1000);
		await artworkCore(31, 1000 + PRELOAD_LIFETIME_MS);

		preloadArtwork(32, 1000);
		await artworkCore(33, 1000);
		await artworkCore(32, 1000);

		expect(vi.mocked(loadArtwork).mock.calls.map(([number]) => number)).toEqual([
			30, 30, 31, 31, 32, 33, 32
		]);
	});

	it('reads the artwork again after any write', async () => {
		preloadArtwork(30, 1000);
		noteWrite();
		await artworkCore(30, 1000);

		expect(loadArtwork).toHaveBeenCalledTimes(2);
	});
});
