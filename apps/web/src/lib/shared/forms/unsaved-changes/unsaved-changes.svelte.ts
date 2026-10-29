import { onDestroy } from 'svelte';
import { beforeNavigate, goto } from '$app/navigation';
import type { ResolvedPathname } from '$app/types';
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
		beforeNavigate((navigation) => {
			if (this.#leaveAllowed()) {
				this.#discarded = null;
				return;
			}
			if (!this.#changed()) return;
			navigation.cancel();
			const url = navigation.to?.url;
			if (navigation.type === 'leave' || !url || this.#question.pending) return;
			const target = `${url.pathname}${url.search}${url.hash}` as ResolvedPathname;
			const popstate = navigation.type === 'popstate' ? navigation.delta : null;
			void this.confirmLeave().then((discard) => {
				if (!discard) return;
				if (popstate === null) void goto(target);
				else history.go(popstate);
			});
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
