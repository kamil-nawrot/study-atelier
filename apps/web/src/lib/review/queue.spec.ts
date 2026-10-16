import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/testing/artworks.ts';
import type { EraCode, WallArtwork } from '#lib/collection/types.ts';
import {
	MIN_ARTWORKS,
	buildSession,
	chooseMode,
	endOfDay,
	interleaveByEra,
	missingArtworks,
	retryLater,
	sessionEntries,
	startOfDay
} from './queue.ts';
import type { ReviewCard, ReviewItem } from './types.ts';

const now = new Date(2026, 9, 16, 9, 0);
const ERAS: EraCode[] = ['antiquity', 'middle_ages', 'early_modern', 'modern'];

function collection(
	count: number,
	overrides: (index: number) => Partial<WallArtwork> = () => ({})
): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`, {
			eraCode: ERAS[index % ERAS.length],
			...overrides(index)
		})
	);
}

function card(artworkId: string, due: Date, overrides: Partial<ReviewCard> = {}): ReviewCard {
	return {
		artworkId,
		due,
		stability: 10,
		difficulty: 5,
		state: 2,
		reps: 3,
		lapses: 0,
		scheduledDays: 10,
		learningSteps: 0,
		lastReview: new Date(due.getTime() - 10 * 24 * 60 * 60 * 1000),
		...overrides
	};
}

function ids(entries: { artwork: WallArtwork }[]): string[] {
	return entries.map((entry) => entry.artwork.id);
}

describe('review queue', () => {
	it('bounds the day by the local midnight', () => {
		expect(startOfDay(now)).toEqual(new Date(2026, 9, 16));
		expect(endOfDay(now)).toEqual(new Date(2026, 9, 17));
	});

	it('needs 20 artworks with an image and says how many are missing', () => {
		const artworks = collection(22, (index) => ({ hasImage: index >= 4 }));
		expect(missingArtworks(artworks)).toBe(2);
		expect(sessionEntries({ artworks, cards: new Map(), now, newToday: 0 })).toEqual([]);
		expect(missingArtworks(collection(MIN_ARTWORKS))).toBe(0);
	});

	it('takes the most overdue artworks first, then new ones in the order they were added', () => {
		const artworks = collection(30, () => ({ eraCode: null }));
		const cards = new Map([
			['artwork-5', card('artwork-5', new Date(2026, 9, 16, 20, 0))],
			['artwork-6', card('artwork-6', new Date(2026, 9, 10))],
			['artwork-7', card('artwork-7', new Date(2026, 9, 17, 1, 0))]
		]);
		const entries = sessionEntries({ artworks, cards, now, newToday: 0 });
		expect(entries).toHaveLength(12);
		expect(ids(entries).slice(0, 2)).toEqual(['artwork-6', 'artwork-5']);
		expect(ids(entries)).not.toContain('artwork-7');
		expect(ids(entries).slice(2)).toEqual([
			'artwork-1',
			'artwork-2',
			'artwork-3',
			'artwork-4',
			'artwork-8',
			'artwork-9',
			'artwork-10',
			'artwork-11',
			'artwork-12',
			'artwork-13'
		]);
	});

	it('limits new artworks to 10 a day, counting those already started today', () => {
		const entries = sessionEntries({
			artworks: collection(30),
			cards: new Map(),
			now,
			newToday: 7
		});
		expect(entries).toHaveLength(3);
		expect(
			sessionEntries({ artworks: collection(30), cards: new Map(), now, newToday: 12 })
		).toEqual([]);
	});

	it('caps a session at 20 artworks, due ones first', () => {
		const artworks = collection(40);
		const cards = new Map(
			artworks
				.slice(0, 25)
				.map((artwork, index) => [artwork.id, card(artwork.id, new Date(2026, 8, 1 + index))])
		);
		const entries = sessionEntries({ artworks, cards, now, newToday: 0 });
		expect(entries).toHaveLength(20);
		expect(entries.every((entry) => entry.card)).toBe(true);
	});

	it('leaves out artworks without an image', () => {
		const artworks = collection(25, (index) => ({ hasImage: index !== 0 }));
		expect(ids(sessionEntries({ artworks, cards: new Map(), now, newToday: 0 }))).not.toContain(
			'artwork-1'
		);
	});

	it('keeps neighbours in different eras where it can', () => {
		const entry = (number: number, eraCode: EraCode | null): { artwork: WallArtwork } => ({
			artwork: testArtwork(number, `A${number}`, { eraCode })
		});
		const ordered = interleaveByEra([
			entry(1, 'modern'),
			entry(2, 'modern'),
			entry(3, 'modern'),
			entry(4, 'antiquity'),
			entry(5, null)
		]);
		expect(ordered.map((item) => item.artwork.number)).toEqual([1, 4, 2, 5, 3]);
	});

	it('asks only flashcards when the learner chose them', () => {
		expect(chooseMode(null, 'flashcards', 0, () => true)).toBe('flashcard');
	});

	it('starts new and forgotten artworks with a quiz in a mixed session', () => {
		expect(chooseMode(null, 'mixed', 0, () => true)).toBe('quiz_title');
		expect(chooseMode(null, 'mixed', 1, () => true)).toBe('quiz_image');
		expect(chooseMode(card('a', now, { state: 3 }), 'mixed', 0, () => true)).toBe('quiz_title');
		expect(chooseMode(null, 'mixed', 1, (mode) => mode === 'quiz_title')).toBe('quiz_title');
		expect(chooseMode(null, 'mixed', 0, () => false)).toBe('flashcard');
	});

	it('gives known artworks a flashcard and recent ones a style quiz every third time', () => {
		const settled = card('a', now, { stability: 30 });
		const recent = card('a', now, { stability: 3 });
		expect(chooseMode(settled, 'mixed', 2, () => true)).toBe('flashcard');
		expect(chooseMode(recent, 'mixed', 1, () => true)).toBe('flashcard');
		expect(chooseMode(recent, 'mixed', 2, () => true)).toBe('quiz_style');
		expect(chooseMode(recent, 'mixed', 2, (mode) => mode !== 'quiz_style')).toBe('flashcard');
	});

	it('rotates the quizzes that can be asked when the learner chose quizzes', () => {
		const canAsk = (mode: string): boolean => mode !== 'quiz_image';
		expect([0, 1, 2].map((position) => chooseMode(null, 'quizzes', position, canAsk))).toEqual([
			'quiz_title',
			'quiz_style',
			'quiz_title'
		]);
		expect(chooseMode(null, 'quizzes', 0, () => false)).toBe('flashcard');
	});

	it('builds flashcards only until quizzes can be asked', () => {
		const session = buildSession({
			artworks: collection(25),
			cards: new Map(),
			now,
			newToday: 0,
			form: 'mixed'
		});
		expect(session).toHaveLength(10);
		expect(session.every((item) => item.mode === 'flashcard' && item.card === null)).toBe(true);
	});

	it('brings an artwork back after three to five others', () => {
		const queue: ReviewItem[] = collection(10).map((artwork) => ({
			artwork,
			card: null,
			mode: 'flashcard'
		}));
		const again = { ...queue[1] };
		expect(retryLater(queue, 1, again, () => 0).indexOf(again)).toBe(5);
		expect(retryLater(queue, 1, again, () => 0.99).indexOf(again)).toBe(7);
		expect(retryLater(queue, 8, again, () => 0).indexOf(again)).toBe(10);
	});
});
