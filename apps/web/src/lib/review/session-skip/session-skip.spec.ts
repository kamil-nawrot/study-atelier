import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { loadFreshItem } from '#lib/review/fresh-item/fresh-item.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import { SessionSkip } from './session-skip.ts';

vi.mock('#lib/backroom/backroom-data/backroom-data.ts', () => ({ loadItemFlags: vi.fn() }));
vi.mock('#lib/review/fresh-item/fresh-item.ts', () => ({ loadFreshItem: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const jerome = testArtwork(1, 'Saint Jerome');
const david = testArtwork(2, 'David');
const mona = testArtwork(3, 'Mona Lisa');
const quiz = { options: [{ label: 'A' }], answer: 0 };

function flag(extra: Partial<StoredFlag>): StoredFlag {
	return {
		id: 'flag',
		reason: 'image',
		comment: null,
		artworkId: null,
		termId: null,
		symbolId: null,
		eventId: null,
		imageId: null,
		pinId: null,
		imageNumber: null,
		question: null,
		holds: true,
		mode: null,
		...extra
	};
}

function skip(): SessionSkip {
	return new SessionSkip(() => ({
		activeForm: 'mixed',
		activeScope: { kind: 'all' },
		freeRound: 0,
		artworksById: new Map(),
		cards: new Map(),
		images: {} as ResolvedImages
	}));
}

describe('SessionSkip', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the held flags and treats a failed load as no holds', async () => {
		vi.mocked(loadItemFlags).mockResolvedValueOnce([flag({ artworkId: jerome.id })]);
		const skipping = skip();

		expect([...(await skipping.loadHolds()).artworks]).toEqual([jerome.id]);
		vi.mocked(loadItemFlags).mockRejectedValueOnce(new TypeError('Failed to fetch'));
		expect((await skipping.loadHolds()).artworks.size).toBe(0);
	});

	it('replaces a wholly held artwork with a fresh one and passes on its details', async () => {
		vi.mocked(loadItemFlags).mockResolvedValue([flag({ artworkId: jerome.id })]);
		const next = { artwork: mona, card: null, mode: 'flashcard' as const };
		const details = new Map([[mona.id, { notes: '' }]]) as Awaited<
			ReturnType<typeof loadFreshItem>
		>['details'];
		vi.mocked(loadFreshItem).mockResolvedValue({ item: next, details });
		const session = new ReviewSession(
			[
				{ artwork: jerome, card: null, mode: 'quiz_title', quiz },
				{ artwork: david, card: null, mode: 'flashcard' },
				{ mode: 'year', artwork: jerome, card: null }
			],
			new Map()
		);
		const ondetails = vi.fn();

		await skip().skip(session, ondetails);

		expect(session.queue).toEqual([next, { artwork: david, card: null, mode: 'flashcard' }]);
		expect(ondetails).toHaveBeenCalledWith(details);
		expect(loadFreshItem).toHaveBeenCalledWith(
			expect.objectContaining({ form: 'mixed', freeRound: undefined })
		);
	});

	it('does nothing after the last question', async () => {
		const session = new ReviewSession([], new Map());

		await skip().skip(session, vi.fn());

		expect(loadItemFlags).not.toHaveBeenCalled();
	});

	it('keeps the question locked while the skip loads and leaves another question alone', async () => {
		let release: (flags: StoredFlag[]) => void = () => {};
		vi.mocked(loadItemFlags).mockReturnValue(new Promise((resolve) => (release = resolve)));
		const session = new ReviewSession(
			[
				{ artwork: jerome, card: null, mode: 'quiz_title', quiz },
				{ artwork: david, card: null, mode: 'flashcard' }
			],
			new Map()
		);

		const skipping = skip().skip(session, vi.fn());
		expect(session.saving).toBe(true);
		await session.answer(0);
		expect(session.chosen).toBeUndefined();

		session.position = 1;
		release([flag({ artworkId: jerome.id })]);
		await skipping;

		expect(session.saving).toBe(false);
		expect(session.queue.map((step) => 'artwork' in step && step.artwork.id)).toEqual([
			jerome.id,
			david.id
		]);
		expect(loadFreshItem).not.toHaveBeenCalled();
	});
});
