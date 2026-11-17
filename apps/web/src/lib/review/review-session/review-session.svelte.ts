import { SvelteMap } from 'svelte/reactivity';
import { currentDate, MAX_REPEATS, retryLater, startOfDay } from '#lib/review/queue/queue.ts';
import { shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import { recordReview, recordRightAnswer } from '#lib/review/review-data/review-data.ts';
import { outcomes, quizRating } from '#lib/review/scheduler/scheduler.ts';
import { ExtraTally } from '#lib/review/extra-tally/extra-tally.svelte.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewAnswerLog } from '#lib/review/types/review-answer-log.ts';
import type { YearAnswerLog } from '#lib/review/types/year-answer-log.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import { boundsOf, yearOutcome, yearsOf } from '#lib/review/year-guess/year-guess.ts';
import { ORDER_SIZE, placedRight } from '#lib/review/order-guess/order-guess.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import {
	artworkItem,
	extraQuiz,
	pickedWrong,
	scoreOf,
	yearScore,
	type ExtraAnswer
} from '#lib/review/step-kinds/step-kinds.ts';

export class ReviewSession {
	queue = $state<SessionStep[]>([]);
	position = $state(0);
	revealed = $state(false);
	chosen = $state<number>();
	typed = $state<readonly string[]>();
	saving = $state(false);
	error = $state<string>();
	answers = $state<ReviewAnswerLog[]>([]);
	guessed = $state<number>();
	yearAnswers = $state<YearAnswerLog[]>([]);
	ordered = $state<WallArtwork[]>();
	orderAnswers = $state<boolean[]>([]);
	styleAnswers = $state<boolean[]>([]);
	readonly cards: Map<string, ReviewCard>;
	readonly styleCards = new SvelteMap<string, ReviewCard>();
	readonly startedAt: number;
	readonly free: boolean;
	#shownAt: number;
	#extras: ExtraTally;
	#repeats = new SvelteMap<string, number>();
	#now: () => Date;
	#random: () => number;

	constructor(
		items: SessionStep[],
		cards: Map<string, ReviewCard>,
		now: () => Date = currentDate,
		random: () => number = Math.random,
		free = false
	) {
		this.queue = items;
		this.free = free;
		this.#extras = new ExtraTally(free);
		this.cards = new SvelteMap(cards);
		this.#now = now;
		this.#random = random;
		this.startedAt = now().getTime();
		this.#shownAt = this.startedAt;
	}

	get current(): SessionStep | undefined {
		return this.queue[this.position];
	}

	get finished(): boolean {
		return this.position >= this.queue.length;
	}

	get extraAnswers(): ExtraAnswer[] {
		return this.#extras.answers;
	}

	get extraFailures(): number {
		return this.#extras.failed;
	}

	get started(): number {
		return this.answers.filter((answer) => answer.item.card === null).length;
	}

	get years(): { asked: number; hit: number } {
		return yearScore(this.yearAnswers);
	}

	get anyAnswer(): boolean {
		return [this.answers, this.yearAnswers, this.orderAnswers, this.styleAnswers].some(
			(answers) => answers.length > 0
		);
	}

	get styles(): { asked: number; right: number } {
		return scoreOf(this.styleAnswers);
	}

	get orders(): { asked: number; right: number } {
		return scoreOf(this.orderAnswers);
	}

	get minutes(): number {
		return Math.max(1, Math.round((this.#now().getTime() - this.startedAt) / 60000));
	}

	next(): Record<ReviewRating, ReviewCard> | undefined {
		const item = this.current;
		return artworkItem(item) ? outcomes(item.artwork.id, item.card, this.#now()) : undefined;
	}

	reveal(): void {
		if (this.current) this.revealed = true;
	}

	async rate(rating: ReviewRating, scheduled?: ReviewCard): Promise<void> {
		const item = this.current;
		if (
			!artworkItem(item) ||
			item.mode === 'quiz_typed' ||
			item.quiz ||
			!this.revealed ||
			this.saving
		) {
			return;
		}
		if (await this.#save(item, rating, scheduled)) this.#advance();
	}

	async answer(choice: number): Promise<void> {
		const item = this.current;
		if (
			!item ||
			item.mode === 'year' ||
			item.mode === 'order' ||
			item.mode === 'event_year' ||
			!item.quiz ||
			this.chosen !== undefined ||
			this.saving
		) {
			return;
		}
		const correct = choice === item.quiz.answer;
		if (extraQuiz(item)) {
			const wrong = pickedWrong(item.quiz, choice);
			if (this.#extras.quiz(item, correct, this.#now(), this.#shownAt, wrong)) this.#retry(item);
			this.chosen = choice;
			return;
		}
		const wrongAnswer = pickedWrong(item.quiz, choice);
		const saved =
			item.facet === 'style'
				? await this.#saveStyle(item, correct, wrongAnswer)
				: await this.#save(item, quizRating(correct), undefined, correct, wrongAnswer);
		if (saved) this.chosen = choice;
	}

	async #saveStyle(item: ReviewItem, correct: boolean, wrongAnswer?: string): Promise<boolean> {
		const now = this.#now();
		const rating = quizRating(correct);
		const key = `style:${item.artwork.id}`;
		const repeats = this.#repeats.get(key);
		const card =
			(repeats === undefined ? null : item.card) ??
			outcomes(item.artwork.id, item.card, now)[rating];
		if (!this.free) {
			this.saving = true;
			this.error = undefined;
			const { error } = await recordReview(card, {
				mode: 'quiz_style',
				facet: 'style',
				rating,
				correct,
				answerMs: now.getTime() - this.#shownAt,
				...(wrongAnswer === undefined ? {} : { wrongAnswer })
			});
			this.saving = false;
			if (error) {
				this.error = error;
				return false;
			}
			this.styleCards.set(item.artwork.id, card);
		}
		if (repeats === undefined) this.styleAnswers.push(correct);
		if (!correct && (repeats ?? 0) < MAX_REPEATS) {
			this.#repeats.set(key, (repeats ?? 0) + 1);
			this.#retry({ ...item, card });
		}
		return true;
	}

	async guess(year: number): Promise<void> {
		const item = this.current;
		if (item?.mode === 'event_year' && this.guessed === undefined) {
			if (this.#extras.event(item, year, this.#now(), this.#shownAt)) this.#retry(item);
			this.guessed = year;
			return;
		}
		if (item?.mode !== 'year' || this.guessed !== undefined || this.saving) return;
		const now = this.#now();
		const years = yearsOf(item.artwork);
		const bounds = boundsOf(item.artwork, now);
		if (!years || !bounds) return;
		const { rating } = yearOutcome(year, years, bounds);
		if (!this.free) {
			this.saving = true;
			this.error = undefined;
			const { error } = await recordReview(outcomes(item.artwork.id, item.card, now)[rating], {
				mode: 'year',
				rating,
				correct: rating > 1,
				answerMs: now.getTime() - this.#shownAt,
				guessedYear: year
			});
			this.saving = false;
			if (error) {
				this.error = error;
				return;
			}
		}
		this.guessed = year;
		this.yearAnswers.push({ artworkId: item.artwork.id, guess: year, rating });
	}

	checkOrder(placed: WallArtwork[]): void {
		const item = this.current;
		if (item?.mode !== 'order' || this.ordered !== undefined) return;
		const right = placedRight(placed) === ORDER_SIZE;
		if (right && !this.free) void recordRightAnswer(startOfDay(this.#now()));
		this.ordered = placed;
		this.orderAnswers.push(right);
	}

	async typeTitle(picked: readonly string[]): Promise<void> {
		const item = this.current;
		if (item?.mode !== 'quiz_typed' || this.typed !== undefined || this.saving) return;
		const correct = picked.includes(item.artwork.id);
		if (await this.#save(item, correct ? 3 : 1, undefined, correct)) this.typed = picked;
	}

	proceed(): void {
		const item = this.current;
		if (!item) return;
		if (
			item.mode === 'year' || item.mode === 'event_year'
				? this.guessed !== undefined
				: item.mode === 'order'
					? this.ordered !== undefined
					: item.mode === 'quiz_typed'
						? this.typed !== undefined
						: item.quiz && this.chosen !== undefined
		) {
			this.#advance();
		}
	}

	async #save(
		item: ReviewItem,
		rating: ReviewRating,
		scheduled: ReviewCard | undefined,
		correct?: boolean,
		wrongAnswer?: string
	): Promise<boolean> {
		const now = this.#now();
		const repeats = this.#repeats.get(item.artwork.id);
		const card =
			repeats === undefined
				? (scheduled ?? outcomes(item.artwork.id, item.card, now)[rating])
				: (item.card ?? outcomes(item.artwork.id, null, now)[rating]);
		if (!this.free) {
			this.saving = true;
			this.error = undefined;
			const { error } = await recordReview(card, {
				mode: item.mode,
				rating,
				correct,
				answerMs: now.getTime() - this.#shownAt,
				...(wrongAnswer === undefined ? {} : { wrongAnswer })
			});
			this.saving = false;
			if (error) {
				this.error = error;
				return false;
			}
		}
		this.cards.set(item.artwork.id, card);
		this.answers.push({ item, rating });
		if (rating === 1 && (repeats ?? 0) < MAX_REPEATS) {
			this.#repeats.set(item.artwork.id, (repeats ?? 0) + 1);
			this.#retry({ ...item, card });
		}
		return true;
	}

	#retry(step: SessionStep): void {
		const again =
			'quiz' in step && step.quiz ? { ...step, quiz: shuffleQuiz(step.quiz, this.#random) } : step;
		this.queue = retryLater(this.queue, this.position, again, this.#random);
	}

	replaceCurrent(queue: SessionStep[]): void {
		this.queue = queue;
		this.#advance(0);
	}

	#advance(by = 1): void {
		this.position += by;
		this.revealed = false;
		this.chosen = undefined;
		this.typed = undefined;
		this.guessed = undefined;
		this.ordered = undefined;
		this.#shownAt = this.#now().getTime();
	}
}
