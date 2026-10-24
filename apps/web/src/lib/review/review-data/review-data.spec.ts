import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	loadReviewCards,
	loadReviewCounts,
	loadReviewDetails,
	loadReviewStreak,
	loadSession,
	recordReview,
	waitingToday,
	withPinPreviews
} from './review-data.ts';
import type { ReviewCard, ReviewItem } from '#lib/review/types.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn(), storage: { from: vi.fn() }, auth: { signOut: vi.fn() } }
}));

const rpc = vi.mocked(supabase.rpc);

const row = {
	artwork_id: 'artwork-1',
	due: '2026-10-17T08:00:00.000Z',
	stability: 4.2,
	difficulty: 5.5,
	state: 2,
	reps: 3,
	lapses: 1,
	scheduled_days: 4,
	learning_steps: 0,
	last_review: '2026-10-13T08:00:00.000Z'
};

const card: ReviewCard = {
	artworkId: 'artwork-1',
	due: new Date('2026-10-17T08:00:00.000Z'),
	stability: 4.2,
	difficulty: 5.5,
	state: 2,
	reps: 3,
	lapses: 1,
	scheduledDays: 4,
	learningSteps: 0,
	lastReview: new Date('2026-10-13T08:00:00.000Z')
};

function cardsQuery(rows: unknown[], error: unknown = null): { range: ReturnType<typeof vi.fn> } {
	const query = {
		select: vi.fn(),
		order: vi.fn(),
		range: vi.fn().mockResolvedValue({ data: rows, error })
	};
	query.select.mockReturnValue(query);
	query.order.mockReturnValue(query);
	vi.mocked(supabase.from).mockReturnValue(query as never);
	return query;
}

function countsCall(data: unknown, error: unknown = null): void {
	rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data, error }) } as never);
}

describe('review data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the review cards by artwork', async () => {
		cardsQuery([row]);
		const { cards, error } = await loadReviewCards();
		expect(error).toBeUndefined();
		expect(supabase.from).toHaveBeenCalledWith('review_cards');
		expect(cards.get('artwork-1')).toEqual(card);
	});

	it('loads every page of review cards', async () => {
		const query = cardsQuery([]);
		query.range
			.mockResolvedValueOnce({
				data: Array.from({ length: 1000 }, (_, i) => ({ ...row, artwork_id: `a${i}` })),
				error: null
			})
			.mockResolvedValueOnce({ data: [row], error: null });
		const { cards } = await loadReviewCards();
		expect(cards.size).toBe(1001);
		expect(query.range).toHaveBeenLastCalledWith(1000, 1999);
	});

	it('says so when the cards cannot be loaded', async () => {
		cardsQuery([], { message: 'TypeError: Failed to fetch' });
		const { cards, error } = await loadReviewCards();
		expect(cards.size).toBe(0);
		expect(error).toBe(m.collectionErrors.network);
	});

	it('counts the reviews from the start of the learner’s day', async () => {
		countsCall({ due: 4, new_available: 30, new_today: 3, with_image: 40 });
		const dayStart = new Date('2026-10-15T22:00:00.000Z');
		await expect(loadReviewCounts(dayStart)).resolves.toEqual({
			counts: { due: 4, newAvailable: 30, newToday: 3, withImage: 40 }
		});
		expect(rpc).toHaveBeenCalledWith('review_counts', { day_start: '2026-10-15T22:00:00.000Z' });
	});

	it('asks for the streak in the learner’s time zone', async () => {
		rpc.mockResolvedValue({ data: 6, error: null } as never);
		const dayStart = new Date('2026-10-15T22:00:00.000Z');
		await expect(loadReviewStreak(dayStart)).resolves.toEqual({ days: 6 });
		expect(rpc).toHaveBeenCalledWith('review_streak', {
			day_start: '2026-10-15T22:00:00.000Z',
			time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
		});
	});

	it('returns no streak and a message when the streak fails', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(loadReviewStreak(new Date())).resolves.toEqual({
			days: 0,
			error: m.collectionErrors.network
		});
	});

	it('returns a message when the counts fail', async () => {
		countsCall(null, { message: 'TypeError: Failed to fetch' });
		await expect(loadReviewCounts(new Date())).resolves.toEqual({
			error: m.collectionErrors.network
		});
	});

	it('counts what waits today: due artworks and new ones up to the daily limit', () => {
		expect(waitingToday({ due: 4, newAvailable: 30, newToday: 3, withImage: 40 })).toBe(11);
		expect(waitingToday({ due: 4, newAvailable: 2, newToday: 0, withImage: 40 })).toBe(6);
		expect(waitingToday({ due: 25, newAvailable: 30, newToday: 10, withImage: 40 })).toBe(25);
	});

	it('counts the new artworks up to the limit of the preferences', () => {
		expect(waitingToday({ due: 4, newAvailable: 30, newToday: 3, withImage: 40 }, 20)).toBe(21);
		expect(waitingToday({ due: 4, newAvailable: 30, newToday: 3, withImage: 40 }, 5)).toBe(6);
	});

	it('shows nothing waiting until the collection has 20 artworks with an image', () => {
		expect(waitingToday({ due: 0, newAvailable: 19, newToday: 0, withImage: 19 })).toBe(0);
	});

	it('records a flashcard rating with the next state of the card', async () => {
		rpc.mockResolvedValue({ error: null } as never);
		await expect(
			recordReview(card, { mode: 'flashcard', rating: 3, answerMs: 2500.4 })
		).resolves.toEqual({});
		expect(rpc).toHaveBeenCalledWith('record_review', {
			target_artwork: 'artwork-1',
			card: {
				due: '2026-10-17T08:00:00.000Z',
				stability: 4.2,
				difficulty: 5.5,
				state: 2,
				reps: 3,
				lapses: 1,
				scheduled_days: 4,
				learning_steps: 0,
				last_review: '2026-10-13T08:00:00.000Z'
			},
			answer: { mode: 'flashcard', rating: 3, correct: null, answer_ms: 2500 }
		});
	});

	it('records whether a quiz answer was right', async () => {
		rpc.mockResolvedValue({ error: null } as never);
		await recordReview(card, { mode: 'quiz_image', rating: 1, correct: false });
		expect(rpc).toHaveBeenCalledWith(
			'record_review',
			expect.objectContaining({
				answer: { mode: 'quiz_image', rating: 1, correct: false, answer_ms: null }
			})
		);
	});

	it('returns the message to show when an answer cannot be saved', async () => {
		rpc.mockResolvedValue({ error: { message: 'TypeError: Failed to fetch' } } as never);
		await expect(recordReview(card, { mode: 'flashcard', rating: 2 })).resolves.toEqual({
			error: m.review.saveFailed
		});
	});

	it('asks the database for a session of the chosen form and scope', async () => {
		const rows = [{ artwork_id: 'artwork-1', mode: 'flashcard' }];
		rpc.mockResolvedValue({ data: rows, error: null } as never);

		await expect(
			loadSession(new Date('2026-10-15T22:00:00.000Z'), 'quizzes', {
				kind: 'style',
				name: 'Caravaggism'
			})
		).resolves.toEqual({ rows });
		expect(rpc).toHaveBeenCalledWith('review_session', {
			day_start: '2026-10-15T22:00:00.000Z',
			session_form: 'quizzes',
			scope_kind: 'style',
			scope_value: 'Caravaggism'
		});

		await loadSession(new Date('2026-10-15T22:00:00.000Z'), 'mixed', {
			kind: 'era',
			code: 'modern'
		});
		expect(rpc).toHaveBeenLastCalledWith(
			'review_session',
			expect.objectContaining({ scope_kind: 'era', scope_value: 'modern' })
		);
		await loadSession(new Date('2026-10-15T22:00:00.000Z'), 'mixed', { kind: 'all' });
		expect(rpc).toHaveBeenLastCalledWith('review_session', {
			day_start: '2026-10-15T22:00:00.000Z',
			session_form: 'mixed',
			scope_kind: 'all'
		});
		await loadSession(new Date('2026-10-15T22:00:00.000Z'), 'flashcards', { kind: 'all' }, 2);
		expect(rpc).toHaveBeenLastCalledWith('review_session', {
			day_start: '2026-10-15T22:00:00.000Z',
			session_form: 'flashcards',
			scope_kind: 'all',
			free_round: 2
		});
	});

	it('returns a message when a session cannot be built', async () => {
		rpc.mockResolvedValue({
			data: null,
			error: { message: 'TypeError: Failed to fetch' }
		} as never);
		await expect(loadSession(new Date(), 'mixed', { kind: 'all' })).resolves.toEqual({
			rows: [],
			error: m.collectionErrors.network
		});
	});

	it('loads the notes and the image credit of the session artworks in one query', async () => {
		const query = { select: vi.fn(), in: vi.fn(), eq: vi.fn() };
		query.select.mockReturnValue(query);
		query.in.mockReturnValue(query);
		query.eq.mockResolvedValue({
			data: [
				{
					id: 'artwork-1',
					notes: 'Look at the light.',
					artwork_images: [
						{
							source_wikidata_id: 'Q1',
							source_image_file: 'Pearl.jpg',
							source_image_licence: 'Public domain',
							source_image_licence_url: null,
							source_image_attribution: null,
							own_image_path: null,
							own_image_url: null,
							image_width: 4,
							image_height: 5
						}
					]
				},
				{
					id: 'artwork-2',
					notes: null,
					artwork_images: [
						{
							source_wikidata_id: null,
							source_image_file: null,
							source_image_licence: null,
							source_image_licence_url: null,
							source_image_attribution: null,
							own_image_path: 'owner/own.jpg',
							own_image_url: null,
							image_width: 4,
							image_height: 5
						}
					]
				},
				{ id: 'artwork-3', notes: null, artwork_images: [] }
			],
			error: null
		});
		vi.mocked(supabase.from).mockReturnValue(query as never);

		const { details, error } = await loadReviewDetails(['artwork-1', 'artwork-2']);

		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.in).toHaveBeenCalledWith('id', ['artwork-1', 'artwork-2']);
		expect(query.eq).toHaveBeenCalledWith('artwork_images.position', 0);
		expect(details.get('artwork-1')).toEqual({
			notes: 'Look at the light.',
			credit: m.artwork.credit
		});
		expect(details.get('artwork-2')).toEqual({
			notes: '',
			credit: m.artworkForm.ownImageCredit
		});
		expect(details.get('artwork-3')).toEqual({ notes: '', credit: undefined });
		expect(error).toBeUndefined();
	});

	it('says so when the notes and credits cannot be loaded', async () => {
		const query = {
			select: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } })
		};
		vi.mocked(supabase.from).mockReturnValue(query as never);

		const { details, error } = await loadReviewDetails(['artwork-1']);

		expect(details.size).toBe(0);
		expect(error).toBe(m.collectionErrors.network);
	});

	it('asks for no details when the session is empty', async () => {
		await expect(loadReviewDetails([])).resolves.toEqual({ details: new Map() });
		expect(supabase.from).not.toHaveBeenCalled();
	});

	it('signs the own image of a pin question and leaves the other items as they are', async () => {
		const createSignedUrl = vi
			.fn()
			.mockResolvedValue({ data: { signedUrl: 'https://signed.test/pin.jpg' }, error: null });
		vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl } as never);
		const flashcard: ReviewItem = {
			artwork: testArtwork(1, 'Lily'),
			card: null,
			mode: 'flashcard'
		};
		const pinned: ReviewItem = {
			artwork: testArtwork(2, 'Apse'),
			card: null,
			mode: 'quiz_pin',
			quiz: { options: [{ label: 'Apse' }], answer: 0 },
			pin: {
				x: 0.5,
				y: 0.5,
				image: { kind: 'upload', path: 'owner/pin.jpg', width: 800, height: 600 }
			}
		};

		const [first, second] = await withPinPreviews([flashcard, pinned]);

		expect(first).toBe(flashcard);
		expect(second.pin?.image).toEqual({
			kind: 'upload',
			path: 'owner/pin.jpg',
			width: 800,
			height: 600,
			previewUrl: 'https://signed.test/pin.jpg'
		});
		expect(createSignedUrl).toHaveBeenCalledWith('owner/pin.jpg', expect.any(Number));
	});
});
