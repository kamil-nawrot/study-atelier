import { onDestroy } from 'svelte';
import { guardLeaving } from '#lib/shared/navigation/leave-guard/leave-guard.svelte.ts';
import { pendingAnswer } from '#lib/shared/forms/pending-answer/pending-answer.ts';

export class UnsavedChanges<T> {
	open = $state(false);

	#question = pendingAnswer();
	#discarded: T | null = null;
	#current: () => T;
	#saved: () => T;
	#differ: (current: T, reference: T) => boolean;

	constructor(current: () => T, saved: () => T, differ: (current: T, reference: T) => boolean) {
		this.#current = current;
		this.#saved = saved;
		this.#differ = differ;
		guardLeaving({
			blocks: () => {
				if (!this.#leaveAllowed()) return this.#changed();
				this.#discarded = null;
				return false;
			},
			asking: () => this.#question.pending,
			confirm: () => this.confirmLeave()
		});
		onDestroy(() => this.#question.answer(false));
	}

	#changed(): boolean {
		return this.#differ(this.#current(), this.#saved());
	}

	#leaveAllowed(): boolean {
		return this.#discarded !== null && !this.#differ(this.#current(), this.#discarded);
	}

	confirmLeave(): Promise<boolean> {
		if (this.#leaveAllowed() || !this.#changed()) return Promise.resolve(true);
		return this.#question
			.ask(() => (this.open = true))
			.then((discard) => {
				if (discard) this.#discarded = this.#current();
				return discard;
			});
	}

	answer(discard: boolean): void {
		this.#question.answer(discard);
		this.open = false;
	}
}
