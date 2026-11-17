import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { NO_HOLDS } from '#lib/review/holds/holds.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { loadReviewDetails, loadSession } from '#lib/review/review-data/review-data.ts';
import { loadFreshItem } from './fresh-item.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({
	loadSession: vi.fn(),
	loadReviewDetails: vi.fn(),
	withPinPreviews: vi.fn(async (items: unknown[]) => items)
}));

const jerome = testArtwork(1, 'Saint Jerome');
const david = testArtwork(2, 'David');
const images = {
	resolve: vi.fn().mockResolvedValue(undefined),
	withImage: (artwork: typeof jerome) => ({ ...artwork, title: `${artwork.title} (shown)` })
} as unknown as ResolvedImages;

function input(holds = NO_HOLDS): Parameters<typeof loadFreshItem>[0] {
	return {
		form: 'mixed',
		scope: { kind: 'all' },
		artworksById: new Map([
			[jerome.id, jerome],
			[david.id, david]
		]),
		cards: new Map(),
		holds,
		queue: [{ artwork: jerome, card: null, mode: 'flashcard' }],
		images,
		now: new Date('2026-11-16T12:00:00')
	};
}

describe('loadFreshItem', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadSession).mockResolvedValue({
			rows: [
				{ artwork_id: jerome.id, mode: 'flashcard', card: null },
				{ artwork_id: david.id, mode: 'flashcard', card: null }
			]
		} as never);
		vi.mocked(loadReviewDetails).mockResolvedValue({ details: new Map([[david.id, {}]]) } as never);
	});

	it('takes the first artwork of a fresh round that the session does not ask yet', async () => {
		const found = await loadFreshItem(input());

		expect(found.item).toMatchObject({
			mode: 'flashcard',
			artwork: { id: david.id, title: 'David (shown)' }
		});
		expect([...found.details.keys()]).toEqual([david.id]);
		expect(images.resolve).toHaveBeenCalledWith([david]);
	});

	it('finds nothing when every artwork of the round is asked or held', async () => {
		const found = await loadFreshItem(input({ ...NO_HOLDS, artworks: new Set([david.id]) }));

		expect(found.item).toBeUndefined();
		expect(loadReviewDetails).not.toHaveBeenCalled();
	});
});
