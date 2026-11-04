import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';

export class ReviewStop {
	open = $state(false);

	#question = pendingAnswer();
	#afterSave = false;
	readonly #session: () => ReviewSession | undefined;
	readonly #finish: () => void;

	constructor(session: () => ReviewSession | undefined, finish: () => void) {
		this.#session = session;
		this.#finish = finish;
	}

	get afterSave(): boolean {
		return this.#afterSave;
	}

	get asking(): boolean {
		return this.#question.pending;
	}

	get guarded(): boolean {
		return this.#answered() && !this.#afterSave;
	}

	#answered(): boolean {
		return !!this.#session()?.anyAnswer;
	}

	confirm(): Promise<boolean> {
		if (!this.#session()) return Promise.resolve(true);
		if (!this.#answered()) {
			this.#finish();
			return Promise.resolve(true);
		}
		return this.#question
			.ask(() => (this.open = true))
			.then((stop) => {
				if (stop) this.#stop();
				return stop;
			});
	}

	answer(stop: boolean): void {
		this.open = false;
		this.#question.answer(stop);
	}

	reset(): void {
		this.#afterSave = false;
	}

	#stop(): void {
		if (this.#session()?.saving) this.#afterSave = true;
		else this.#finish();
	}
}
