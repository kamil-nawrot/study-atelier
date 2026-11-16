import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import {
	recordPairAnswer,
	recordReview,
	recordRightAnswer
} from '#lib/review/review-data/review-data.ts';
import { recordExtraReview } from '#lib/review/extra-cards-data/extra-cards-data.ts';
import { extraScoreOf } from '#lib/review/step-kinds/step-kinds.ts';
import { ReviewSession } from './review-session.svelte.ts';
import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
import type { PairItem } from '#lib/review/types/pair-item.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { YearItem } from '#lib/review/types/year-item.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({
	recordPairAnswer: vi.fn(),
	recordReview: vi.fn(),
	recordRightAnswer: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));
vi.mock('#lib/review/extra-cards-data/extra-cards-data.ts', () => ({
	recordExtraReview: vi.fn().mockResolvedValue(undefined)
}));

const start = new Date(2026, 9, 16, 9, 0);

function items(count: number): ReviewItem[] {
	return Array.from({ length: count }, (_, index) => ({
		artwork: testArtwork(index + 1, `Artwork ${index + 1}`),
		card: null,
		mode: 'flashcard'
	}));
}

function session(count: number, clock: { now: Date }): ReviewSession {
	return new ReviewSession(
		items(count),
		new Map(),
		() => clock.now,
		() => 0
	);
}

function artworkSteps(review: ReviewSession): ReviewItem[] {
	return review.queue as ReviewItem[];
}

function definition(name: string): DefinitionItem {
	return {
		mode: 'quiz_definition',
		term: {
			id: name,
			name,
			category: 'architecture',
			definition: `${name} is a part of a church.`,
			synonyms: [],
			forms: [],
			hasDefinition: true
		},
		quiz: { answer: 0, options: [name, 'Nave', 'Choir', 'Portal'].map((label) => ({ label })) }
	};
}

describe('ReviewSession', () => {
	beforeEach(() => {
		vi.mocked(recordReview).mockReset().mockResolvedValue({});
		vi.mocked(recordRightAnswer).mockReset().mockResolvedValue();
	});

	it('rates only a revealed card and saves the new state with the time it took', async () => {
		const clock = { now: start };
		const review = session(2, clock);

		await review.rate(3);
		expect(recordReview).not.toHaveBeenCalled();

		review.reveal();
		clock.now = new Date(start.getTime() + 4000);
		await review.rate(3);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1', reps: 1 }),
			{ mode: 'flashcard', rating: 3, answerMs: 4000 }
		);
		expect(review.position).toBe(1);
		expect(review.revealed).toBe(false);
		expect(review.cards.get('artwork-1')?.reps).toBe(1);
	});

	it('brings a forgotten artwork back after three to five others', async () => {
		const clock = { now: start };
		const review = session(6, clock);

		review.reveal();
		await review.rate(1);

		expect(artworkSteps(review).map((item) => item.artwork.number)).toEqual([1, 2, 3, 4, 1, 5, 6]);
		expect(artworkSteps(review)[4].card?.reps).toBe(1);
	});

	it('keeps the card of the first answer and asks an artwork at most three times', async () => {
		const clock = { now: start };
		const review = session(1, clock);

		for (let shown = 0; shown < 3; shown += 1) {
			review.reveal();
			clock.now = new Date(start.getTime() + (shown + 1) * 60_000);
			await review.rate(1);
		}

		expect(review.finished).toBe(true);
		expect(review.queue).toHaveLength(3);
		const saved = vi.mocked(recordReview).mock.calls.map(([card]) => card);
		expect(saved.map((card) => card.reps)).toEqual([1, 1, 1]);
		expect(saved[1]).toEqual(saved[0]);
		expect(review.cards.get('artwork-1')).toEqual(saved[0]);
	});

	it('keeps the card of the first answer when the repeated question is right', async () => {
		const clock = { now: start };
		const review = session(1, clock);

		review.reveal();
		await review.rate(1);
		review.reveal();
		await review.rate(3);

		const [first, repeated] = vi.mocked(recordReview).mock.calls;
		expect(repeated[0]).toEqual(first[0]);
		expect(repeated[1]).toEqual(expect.objectContaining({ rating: 3 }));
		expect(review.cards.get('artwork-1')?.lastRating).toBe(1);
	});

	it('keeps the card on screen with the error when the answer is not saved', async () => {
		vi.mocked(recordReview).mockResolvedValue({ error: 'Not saved.' });
		const clock = { now: start };
		const review = session(2, clock);

		review.reveal();
		await review.rate(2);

		expect(review.error).toBe('Not saved.');
		expect(review.position).toBe(0);
		expect(review.revealed).toBe(true);
		expect(review.answers).toHaveLength(0);
	});

	it('finishes after the last card and counts the artworks seen for the first time', async () => {
		const clock = { now: start };
		const review = session(2, clock);

		for (const rating of [3, 2] as const) {
			review.reveal();
			await review.rate(rating);
		}
		clock.now = new Date(start.getTime() + 150_000);

		expect(review.finished).toBe(true);
		expect(review.started).toBe(2);
		expect(review.minutes).toBe(3);
		expect(review.answers.map((answer) => answer.rating)).toEqual([3, 2]);
	});

	it('saves a quiz answer at once and moves on only when asked', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			quizItems(2),
			new Map(),
			() => clock.now,
			() => 0
		);

		await review.answer(1);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1' }),
			expect.objectContaining({ mode: 'quiz_title', rating: 2, correct: true })
		);
		expect(vi.mocked(recordReview).mock.calls[0][1]).not.toHaveProperty('wrongAnswer');
		expect(review.chosen).toBe(1);
		expect(review.position).toBe(0);

		await review.answer(2);
		expect(recordReview).toHaveBeenCalledTimes(1);

		review.proceed();
		expect(review.position).toBe(1);
		expect(review.chosen).toBeUndefined();
	});

	it('rates a style answer on the style card alone and asks a wrong one again on the same card', async () => {
		const clock = { now: start };
		const recognition = new Map([['artwork-1', testReviewCard('artwork-1', start)]]);
		const style: ReviewItem = { ...quizItems(1)[0], mode: 'quiz_style', facet: 'style' };
		const review = new ReviewSession(
			[style, ...quizItems(5).slice(1)],
			recognition,
			() => clock.now,
			() => 0
		);

		await review.answer(0);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1', reps: 1 }),
			expect.objectContaining({
				mode: 'quiz_style',
				facet: 'style',
				rating: 1,
				correct: false,
				wrongAnswer: 'Other A'
			})
		);
		expect(review.cards.get('artwork-1')).toEqual(recognition.get('artwork-1'));
		expect(review.styleCards.get('artwork-1')?.reps).toBe(1);
		expect(review.answers).toHaveLength(0);
		expect(review.queue).toHaveLength(6);
		expect(review.styles).toEqual({ asked: 1, right: 0 });
		expect(review.anyAnswer).toBe(true);

		review.proceed();
		review.position = review.queue.findIndex(
			(step, index) => index > 0 && 'facet' in step && step.facet === 'style'
		);
		const current = review.current;
		const answer = current && 'quiz' in current ? (current.quiz?.answer ?? 0) : 0;
		await review.answer(answer);

		expect(recordReview).toHaveBeenLastCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1', reps: 1 }),
			expect.objectContaining({ facet: 'style', correct: true })
		);
		expect(review.styles).toEqual({ asked: 1, right: 0 });
	});

	it('counts a style answer of a free round without saving it', async () => {
		const clock = { now: start };
		const style: ReviewItem = { ...quizItems(1)[0], mode: 'quiz_style', facet: 'style' };
		const review = new ReviewSession(
			[style],
			new Map(),
			() => clock.now,
			() => 0,
			true
		);

		await review.answer(1);

		expect(recordReview).not.toHaveBeenCalled();
		expect(review.styleCards.size).toBe(0);
		expect(review.styles).toEqual({ asked: 1, right: 1 });
	});

	it('counts a wrong quiz answer as not known and asks it again later', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			quizItems(6),
			new Map(),
			() => clock.now,
			() => 0
		);

		await review.answer(0);

		expect(recordReview).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ rating: 1, correct: false, wrongAnswer: 'Other A' })
		);
		const retry = artworkSteps(review)[4];
		expect(retry.artwork.number).toBe(1);
		expect(retry.quiz?.options[retry.quiz.answer].label).toBe('Artwork 1');
	});

	it('rates a typed title as known when the right artwork is picked', async () => {
		const typed: ReviewItem[] = items(6).map((item) => ({ ...item, mode: 'quiz_typed' }));
		const review = new ReviewSession(
			typed,
			new Map(),
			() => start,
			() => 0
		);

		await review.typeTitle(['artwork-2', 'artwork-1']);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1' }),
			expect.objectContaining({ mode: 'quiz_typed', rating: 3, correct: true })
		);
		expect(review.typed).toEqual(['artwork-2', 'artwork-1']);
		await review.typeTitle(['artwork-3']);
		expect(recordReview).toHaveBeenCalledTimes(1);
		await review.rate(3);
		expect(recordReview).toHaveBeenCalledTimes(1);

		review.proceed();
		expect(review.position).toBe(1);
		expect(review.typed).toBeUndefined();
	});

	it('asks a wrong typed title again later', async () => {
		const typed: ReviewItem[] = items(6).map((item) => ({ ...item, mode: 'quiz_typed' }));
		const review = new ReviewSession(
			typed,
			new Map(),
			() => start,
			() => 0
		);

		await review.typeTitle(['artwork-2']);

		expect(recordReview).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ mode: 'quiz_typed', rating: 1, correct: false })
		);
		expect(artworkSteps(review)[4]).toMatchObject({ mode: 'quiz_typed', artwork: { number: 1 } });
	});

	it('asks a note gap again after a wrong answer and gives a point only for a first right one', async () => {
		vi.mocked(recordRightAnswer).mockClear();
		const gap: NoteGapItem = {
			mode: 'note_gap',
			artwork: testArtwork(9, 'Portal'),
			term: definition('Tympanon').term,
			segments: [{ text: 'Tympanon', masked: true }],
			quiz: {
				answer: 0,
				options: ['Tympanon', 'Nave', 'Choir', 'Portal'].map((label) => ({ label }))
			}
		};
		const review = new ReviewSession(
			[gap, ...items(5)],
			new Map(),
			() => start,
			() => 0
		);

		await review.answer(1);
		expect(recordReview).not.toHaveBeenCalled();
		expect(review.queue.filter((step) => step.mode === 'note_gap')).toHaveLength(2);
		review.proceed();
		const retry = review.queue.findIndex((step, index) => index > 0 && step.mode === 'note_gap');
		review.position = retry;
		await review.answer(0);
		expect(recordRightAnswer).not.toHaveBeenCalled();

		const first = new ReviewSession(
			[gap, ...items(2)],
			new Map(),
			() => start,
			() => 0
		);
		await first.answer(0);
		expect(recordRightAnswer).toHaveBeenCalledOnce();
		expect(extraScoreOf(review.extraAnswers, 'note_gap')).toEqual({ asked: 1, right: 0 });
		expect(extraScoreOf(first.extraAnswers, 'note_gap')).toEqual({ asked: 1, right: 1 });
		expect(extraScoreOf(first.extraAnswers, 'quiz_definition')).toEqual({ asked: 0, right: 0 });
	});

	it('asks a missed extra question again at most twice', async () => {
		const gap: NoteGapItem = {
			mode: 'note_gap',
			artwork: testArtwork(9, 'Portal'),
			term: definition('Tympanon').term,
			segments: [{ text: 'Tympanon', masked: true }],
			quiz: {
				answer: 0,
				options: ['Tympanon', 'Nave', 'Choir', 'Portal'].map((label) => ({ label }))
			}
		};
		const review = new ReviewSession(
			[gap, ...items(5)],
			new Map(),
			() => start,
			() => 0
		);
		const gaps = (): number => review.queue.filter((step) => step.mode === 'note_gap').length;

		for (let miss = 0; miss < 3; miss += 1) {
			review.position = review.queue.findIndex(
				(step, index) => index >= review.position && step.mode === 'note_gap'
			);
			await review.answer(1);
			review.proceed();
		}

		expect(gaps()).toBe(3);
	});

	it('records the first answer to a confused pair once and asks it again after a wrong one', async () => {
		vi.mocked(recordRightAnswer).mockClear();
		const monet = testArtwork(7, 'Impression', { authors: ['Claude Monet'] });
		const manet = testArtwork(8, 'Olympia', { authors: ['Édouard Manet'] });
		const pair: PairItem = {
			mode: 'quiz_pair',
			kind: 'author',
			key: 'author:claude monet|édouard manet',
			asked: 'Claude Monet',
			other: 'Édouard Manet',
			quiz: {
				answer: 0,
				options: [monet, manet].map((artwork) => ({ label: artwork.title, artwork }))
			}
		};
		const review = new ReviewSession(
			[pair, ...items(5)],
			new Map(),
			() => start,
			() => 0
		);

		await review.answer(1);
		expect(recordPairAnswer).toHaveBeenCalledExactlyOnceWith(pair, false);
		expect(review.queue.filter((step) => step.mode === 'quiz_pair')).toHaveLength(2);
		review.proceed();
		review.position = review.queue.findIndex(
			(step, index) => index > 0 && step.mode === 'quiz_pair'
		);
		await review.answer(review.current?.mode === 'quiz_pair' ? review.current.quiz.answer : 0);
		expect(recordPairAnswer).toHaveBeenCalledOnce();
		expect(recordRightAnswer).not.toHaveBeenCalled();
		expect(extraScoreOf(review.extraAnswers, 'quiz_pair')).toEqual({ asked: 1, right: 0 });

		const free = new ReviewSession(
			[pair, ...items(2)],
			new Map(),
			() => start,
			() => 0,
			true
		);
		await free.answer(0);
		expect(recordPairAnswer).toHaveBeenCalledOnce();
		expect(extraScoreOf(free.extraAnswers, 'quiz_pair')).toEqual({ asked: 1, right: 1 });
	});

	it('does not rate a quiz like a flashcard', async () => {
		const review = new ReviewSession(
			quizItems(1),
			new Map(),
			() => start,
			() => 0
		);

		review.reveal();
		await review.rate(3);

		expect(recordReview).not.toHaveBeenCalled();
	});

	it('saves nothing in a free session and still asks a forgotten artwork again', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			items(6),
			new Map(),
			() => clock.now,
			() => 0,
			true
		);

		review.reveal();
		await review.rate(1);
		await review.answer(0);

		expect(recordReview).not.toHaveBeenCalled();
		expect(review.position).toBe(1);
		expect(review.answers).toHaveLength(1);
		expect(artworkSteps(review).map((item) => item.artwork.number)).toEqual([1, 2, 3, 4, 1, 5, 6]);
	});

	it('answers a definition without saving and brings a wrong one back later', async () => {
		const review = new ReviewSession(
			[definition('Apse'), ...items(5), definition('Crypt')],
			new Map(),
			() => start,
			() => 0
		);

		await review.answer(1);
		expect(recordReview).not.toHaveBeenCalled();
		expect(review.chosen).toBe(1);
		expect(review.answers).toHaveLength(0);
		expect(review.queue).toHaveLength(8);
		expect(review.queue[4]).toMatchObject({ mode: 'quiz_definition', term: { name: 'Apse' } });

		review.proceed();
		expect(review.position).toBe(1);
		expect(review.next()).toBeDefined();
	});

	it('does not bring back a definition answered right', async () => {
		const review = new ReviewSession([definition('Apse'), ...items(2)], new Map(), () => start);

		await review.answer(0);
		expect(review.queue).toHaveLength(3);
		expect(review.next()).toBeUndefined();
	});

	it('gives a point for a definition answered right the first time it is asked', async () => {
		const review = new ReviewSession(
			[definition('Apse'), ...items(5), definition('Crypt')],
			new Map(),
			() => start,
			() => 0
		);

		await review.answer(0);
		expect(recordRightAnswer).toHaveBeenCalledExactlyOnceWith(new Date(2026, 9, 16));

		review.proceed();
		vi.mocked(recordRightAnswer).mockClear();
		review.position = 6;
		await review.answer(1);
		review.proceed();
		await review.answer(0);
		expect(review.queue[review.position]).toMatchObject({ term: { name: 'Crypt' } });
		expect(recordRightAnswer).not.toHaveBeenCalled();
	});

	it('saves a year guess on the date card with its rating and moves on', async () => {
		const dated = yearStep(1503, 1519);
		const review = new ReviewSession(
			[...items(2), dated],
			new Map(),
			() => start,
			() => 0
		);
		review.position = 2;

		await review.guess(1540);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: dated.artwork.id }),
			expect.objectContaining({ mode: 'year', rating: 2, correct: true, guessedYear: 1540 })
		);
		expect(review.guessed).toBe(1540);
		expect(review.years).toEqual({ asked: 1, hit: 1 });
		expect(review.answers).toHaveLength(0);
		expect(review.cards.has(dated.artwork.id)).toBe(false);
		expect(review.queue).toHaveLength(3);

		review.proceed();
		expect(review.finished).toBe(true);
		expect(review.guessed).toBeUndefined();
	});

	it('keeps a year question when its guess cannot be saved', async () => {
		vi.mocked(recordReview).mockResolvedValue({ error: 'Not saved.' });
		const review = new ReviewSession([yearStep(null, 1503)], new Map(), () => start);

		await review.guess(1400);

		expect(review.error).toBe('Not saved.');
		expect(review.guessed).toBeUndefined();
		expect(review.years).toEqual({ asked: 0, hit: 0 });
	});

	it('counts a far year guess in a free round without saving it', async () => {
		const review = new ReviewSession(
			[yearStep(null, 1503)],
			new Map(),
			() => start,
			() => 0,
			true
		);

		await review.guess(1700);

		expect(recordReview).not.toHaveBeenCalled();
		expect(review.years).toEqual({ asked: 1, hit: 0 });
	});

	it('gives a point for a whole order put right and counts every order answer', () => {
		const works = [1, 2, 3, 4].map((number) =>
			testArtwork(20 + number, `Work ${number}`, { yearTo: 1400 + number * 100 })
		);
		const review = new ReviewSession(
			[
				{ mode: 'order', artworks: [...works].reverse() },
				{ mode: 'order', artworks: [...works].reverse() }
			],
			new Map(),
			() => start,
			() => 0
		);

		review.checkOrder(works);
		expect(recordRightAnswer).toHaveBeenCalledExactlyOnceWith(new Date(2026, 9, 16));
		expect(review.ordered).toEqual(works);
		review.proceed();
		expect(review.ordered).toBeUndefined();

		review.checkOrder([works[1], works[0], works[2], works[3]]);
		review.checkOrder(works);
		expect(recordRightAnswer).toHaveBeenCalledOnce();
		expect(review.orders).toEqual({ asked: 2, right: 1 });
		expect(review.answers).toHaveLength(0);
		expect(review.anyAnswer).toBe(true);
	});

	it('gives no point for an order in a free round', () => {
		const works = [1, 2, 3, 4].map((number) =>
			testArtwork(20 + number, `Work ${number}`, { yearTo: 1400 + number * 100 })
		);
		const review = new ReviewSession(
			[{ mode: 'order', artworks: works }],
			new Map(),
			() => start,
			() => 0,
			true
		);

		review.checkOrder(works);
		expect(recordRightAnswer).not.toHaveBeenCalled();
		expect(review.orders).toEqual({ asked: 1, right: 1 });
	});

	it('gives no point for a definition in a free round', async () => {
		const review = new ReviewSession(
			[definition('Apse'), ...items(2)],
			new Map(),
			() => start,
			() => 0,
			true
		);

		await review.answer(0);
		expect(recordRightAnswer).not.toHaveBeenCalled();
	});

	it('schedules a term with its first answer and the wrong pick and saves nothing in a free round', async () => {
		vi.mocked(recordExtraReview).mockClear();
		const later = new Date(start.getTime() + 4000);
		let now = start;
		const review = new ReviewSession(
			[definition('Apse'), ...items(2)],
			new Map(),
			() => now,
			() => 0
		);
		now = later;

		await review.answer(2);

		expect(recordExtraReview).toHaveBeenCalledWith(
			{ termId: 'Apse' },
			expect.objectContaining({ lastRating: 1 }),
			{ correct: false, answerMs: 4000, wrongAnswer: 'Choir', mode: 'quiz_definition' },
			later
		);

		const free = new ReviewSession(
			[definition('Apse'), ...items(2)],
			new Map(),
			() => start,
			() => 0,
			true
		);
		await free.answer(0);
		expect(recordExtraReview).toHaveBeenCalledOnce();
	});

	it('puts another question in place of a skipped one and starts it afresh', async () => {
		const review = new ReviewSession(
			quizItems(3),
			new Map(),
			() => start,
			() => 0
		);
		const replacement = items(1)[0];

		review.replaceCurrent([replacement, ...review.queue.slice(1)]);

		expect(review.current).toEqual(replacement);
		expect(review.position).toBe(0);
		expect(review.answers).toHaveLength(0);
		review.replaceCurrent(review.queue.slice(1));
		expect(review.queue).toHaveLength(2);
	});
});

function yearStep(yearFrom: number | null, yearTo: number): YearItem {
	return {
		mode: 'year',
		artwork: testArtwork(9, 'Mona Lisa', { eraCode: 'early_modern', yearFrom, yearTo }),
		card: null
	};
}

function quizItems(count: number): ReviewItem[] {
	return items(count).map((item) => ({
		...item,
		mode: 'quiz_title',
		quiz: {
			answer: 1,
			options: ['Other A', item.artwork.title, 'Other B', 'Other C'].map((label) => ({ label }))
		}
	}));
}
