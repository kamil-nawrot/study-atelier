import { untrack } from 'svelte';

export class SaveQueue<T> {
	busy = $state(false);
	error = $state('');
	#waiting: T[] = [];
	#save: (value: T) => Promise<string | undefined>;

	constructor(save: (value: T) => Promise<string | undefined>) {
		this.#save = save;
	}

	push(value: T): void {
		this.#waiting.push(value);
		if (!untrack(() => this.busy)) void this.#drain();
	}

	async #drain(): Promise<void> {
		this.busy = true;
		while (this.#waiting.length > 0) {
			const value = this.#waiting.shift() as T;
			const error = await this.#save(value);
			this.error = error ?? '';
			if (error !== undefined) this.#waiting = [];
		}
		this.busy = false;
	}
}
