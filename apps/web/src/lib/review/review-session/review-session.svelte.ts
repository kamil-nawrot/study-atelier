import { SvelteMap } from 'svelte/reactivity';
import { currentDate, retryLater } from '#lib/review/queue/queue.ts';
import { shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import { recordReview } from '#lib/review/review-data/review-data.ts';
import { outcomes, quizRating } from '#lib/review/scheduler/scheduler.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type ReviewAnswerLog = {
	item: ReviewItem;
	rating: ReviewRating;
};

export class ReviewSession {
	queue = $state<SessionStep[]>([]);
	position = $state(0);
	revealed = $state(false);
	chosen = $state<number>();
	saving = $state(false);
	error = $state<string>();
	answers = $state<ReviewAnswerLog[]>([]);
	readonly cards: Map<string, ReviewCard>;
	readonly startedAt: number;
	readonly free: boolean;
	#shownAt: number;
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

	get started(): number {
		return this.answers.filter((answer) => answer.item.card === null).length;
	}

	get minutes(): number {
		return Math.max(1, Math.round((this.#now().getTime() - this.startedAt) / 60000));
	}

	next(): Record<ReviewRating, ReviewCard> | undefined {
		const item = this.current;
		return item && item.mode !== 'quiz_definition'
			? outcomes(item.artwork.id, item.card, this.#now())
			: undefined;
	}

	reveal(): void {
		if (this.current) this.revealed = true;
	}

	async rate(rating: ReviewRating, scheduled?: ReviewCard): Promise<void> {
		const item = this.current;
		if (!item || item.mode === 'quiz_definition' || item.quiz || !this.revealed || this.saving) {
			return;
		}
		if (await this.#save(item, rating, scheduled)) this.#advance();
	}

	async answer(choice: number): Promise<void> {
		const item = this.current;
		if (!item?.quiz || this.chosen !== undefined || this.saving) return;
		const correct = choice === item.quiz.answer;
		if (item.mode === 'quiz_definition') {
			if (!correct) this.#retry({ ...item, quiz: shuffleQuiz(item.quiz, this.#random) });
			this.chosen = choice;
			return;
		}
		if (await this.#save(item, quizRating(correct), undefined, correct)) this.chosen = choice;
	}

	proceed(): void {
		if (this.current?.quiz && this.chosen !== undefined) this.#advance();
	}

	async #save(
		item: ReviewItem,
		rating: ReviewRating,
		scheduled: ReviewCard | undefined,
		correct?: boolean
	): Promise<boolean> {
		const now = this.#now();
		const card = scheduled ?? outcomes(item.artwork.id, item.card, now)[rating];
		if (!this.free) {
			this.saving = true;
			this.error = undefined;
			const { error } = await recordReview(card, {
				mode: item.mode,
				rating,
				correct,
				answerMs: now.getTime() - this.#shownAt
			});
			this.saving = false;
			if (error) {
				this.error = error;
				return false;
			}
		}
		this.cards.set(item.artwork.id, card);
		this.answers.push({ item, rating });
		if (rating === 1) {
			const retry = item.quiz
				? { ...item, card, quiz: shuffleQuiz(item.quiz, this.#random) }
				: { ...item, card };
			this.#retry(retry);
		}
		return true;
	}

	#retry(step: SessionStep): void {
		this.queue = retryLater(this.queue, this.position, step, this.#random);
	}

	#advance(): void {
		this.position += 1;
		this.revealed = false;
		this.chosen = undefined;
		this.#shownAt = this.#now().getTime();
	}
}
