import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { eventRating } from '#lib/review/event-questions/event-questions.ts';
import { recordEventAnswer, recordExtraAnswer } from '#lib/review/extra-answers/extra-answers.ts';
import { MAX_REPEATS, startOfDay } from '#lib/review/queue/queue.ts';
import { recordRightAnswer } from '#lib/review/review-data/review-data.ts';
import {
	extraKey,
	type ExtraAnswer,
	type ExtraMode,
	type ExtraQuizItem
} from '#lib/review/step-kinds/step-kinds.ts';
import type { EventItem } from '#lib/review/types/event-item.ts';

export class ExtraTally {
	answers = $state<ExtraAnswer[]>([]);
	readonly #free: boolean;
	#asked = new SvelteSet<string>();
	#missed = new SvelteMap<string, number>();

	constructor(free: boolean) {
		this.#free = free;
	}

	quiz(
		item: ExtraQuizItem,
		correct: boolean,
		now: Date,
		shownAt: number,
		wrongAnswer?: string
	): boolean {
		return this.#count(extraKey(item), item.mode, correct, now, () =>
			recordExtraAnswer(item, correct, now, shownAt, wrongAnswer)
		);
	}

	event(item: EventItem, year: number, now: Date, shownAt: number): boolean {
		const rating = eventRating(item, year, now);
		return this.#count(`event:${item.event.id}`, 'event_year', rating > 1, now, () =>
			recordEventAnswer(item, rating, now, shownAt)
		);
	}

	#count(
		key: string,
		mode: ExtraMode,
		correct: boolean,
		now: Date,
		record: () => Promise<void>
	): boolean {
		if (!this.#asked.has(key)) {
			this.#asked.add(key);
			this.answers.push({ mode, right: correct });
			if (!this.#free) void record();
		}
		if (correct) {
			if (!this.#free && !this.#missed.has(key)) void recordRightAnswer(startOfDay(now));
			return false;
		}
		const missed = this.#missed.get(key) ?? 0;
		this.#missed.set(key, missed + 1);
		return missed < MAX_REPEATS;
	}
}
