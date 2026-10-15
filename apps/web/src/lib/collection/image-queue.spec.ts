import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/testing/artworks.ts';
import { IMAGE_BATCH_DELAY, IMAGE_BATCH_SIZE, ImageQueue } from './image-queue.ts';
import type { WallArtwork } from './types.ts';

function pending(number: number): WallArtwork {
	return testArtwork(number, `Artwork ${number}`, {
		pendingImage: { sourceFile: `${number}.jpg` }
	});
}

describe('ImageQueue', () => {
	const resolve = vi.fn();
	const onresolved = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		resolve.mockImplementation(async (artworks: WallArtwork[]) => artworks);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('resolves the artworks requested within a moment in one batch', async () => {
		const queue = new ImageQueue(resolve, onresolved);

		queue.request(pending(1));
		queue.request(pending(2));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);

		expect(resolve).toHaveBeenCalledTimes(1);
		expect(resolve.mock.calls[0][0].map((artwork: WallArtwork) => artwork.number)).toEqual([1, 2]);
		expect(onresolved).toHaveBeenCalledTimes(1);
	});

	it('splits a long request into batches that run one after another', async () => {
		const queue = new ImageQueue(resolve, onresolved);

		for (let number = 1; number <= IMAGE_BATCH_SIZE + 5; number++) queue.request(pending(number));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);

		expect(resolve.mock.calls.map(([batch]) => batch.length)).toEqual([IMAGE_BATCH_SIZE, 5]);
	});

	it('asks for an artwork only once and skips artworks that wait for no image', async () => {
		const queue = new ImageQueue(resolve, onresolved);

		queue.request(pending(1));
		queue.request(pending(1));
		queue.request(testArtwork(2, 'Done'));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);

		expect(resolve.mock.calls[0][0]).toHaveLength(1);
	});

	it('forgets what was requested and drops late results after a reset', async () => {
		let finish: (artworks: WallArtwork[]) => void = () => undefined;
		resolve.mockImplementationOnce(() => new Promise((done) => (finish = done)));
		const queue = new ImageQueue(resolve, onresolved);

		queue.request(pending(1));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);
		queue.reset();
		finish([pending(1)]);
		await vi.advanceTimersByTimeAsync(0);
		queue.request(pending(1));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);

		expect(onresolved).toHaveBeenCalledTimes(1);
		expect(resolve).toHaveBeenCalledTimes(2);
	});

	it('keeps working after a batch fails', async () => {
		resolve.mockRejectedValueOnce(new Error('offline'));
		const queue = new ImageQueue(resolve, onresolved);

		queue.request(pending(1));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY).catch(() => undefined);
		queue.request(pending(2));
		await vi.advanceTimersByTimeAsync(IMAGE_BATCH_DELAY);

		expect(onresolved).toHaveBeenCalledTimes(1);
	});
});
