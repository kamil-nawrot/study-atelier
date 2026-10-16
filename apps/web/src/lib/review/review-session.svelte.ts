import { SvelteMap } from 'svelte/reactivity';
import { currentDate, retryLater } from './queue.ts';
import { recordReview } from './review-data.ts';
import { outcomes } from './scheduler.ts';
import type { ReviewCard, ReviewItem, ReviewRating } from './types.ts';

export type ReviewAnswerLog = {
	item: ReviewItem;
	rating: ReviewRating;
};

export class ReviewSession {
	queue = $state<ReviewItem[]>([]);
	position = $state(0);
	revealed = $state(false);
	saving = $state(false);
	error = $state<string>();
	answers = $state<ReviewAnswerLog[]>([]);
	readonly cards: Map<string, ReviewCard>;
	readonly startedAt: number;
	#shownAt: number;
	#now: () => Date;
	#random: () => number;

	constructor(
		items: ReviewItem[],
		cards: Map<string, ReviewCard>,
		now: () => Date = currentDate,
		random: () => number = Math.random
	) {
		this.queue = items;
		this.cards = new SvelteMap(cards);
		this.#now = now;
		this.#random = random;
		this.startedAt = now().getTime();
		this.#shownAt = this.startedAt;
	}

	get current(): ReviewItem | undefined {
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
		return item ? outcomes(item.artwork.id, item.card, this.#now()) : undefined;
	}

	reveal(): void {
		if (this.current) this.revealed = true;
	}

	async rate(rating: ReviewRating, scheduled?: ReviewCard): Promise<void> {
		const item = this.current;
		if (!item || !this.revealed || this.saving) return;
		const now = this.#now();
		const card = scheduled ?? outcomes(item.artwork.id, item.card, now)[rating];
		this.saving = true;
		this.error = undefined;
		const { error } = await recordReview(card, {
			mode: item.mode,
			rating,
			answerMs: now.getTime() - this.#shownAt
		});
		this.saving = false;
		if (error) {
			this.error = error;
			return;
		}
		this.cards.set(item.artwork.id, card);
		this.answers.push({ item, rating });
		if (rating === 1) {
			this.queue = retryLater(this.queue, this.position, { ...item, card }, this.#random);
		}
		this.position += 1;
		this.revealed = false;
		this.#shownAt = this.#now().getTime();
	}
}
