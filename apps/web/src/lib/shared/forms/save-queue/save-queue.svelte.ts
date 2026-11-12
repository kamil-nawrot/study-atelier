import { untrack } from 'svelte';

type Options = {
	latestOnly?: boolean;
	failed?: string;
};

export class SaveQueue<T> {
	busy = $state(false);
	error = $state('');
	#waiting: T[] = [];
	#save: (value: T) => Promise<string | undefined>;
	#options: Options;

	constructor(save: (value: T) => Promise<string | undefined>, options: Options = {}) {
		this.#save = save;
		this.#options = options;
	}

	push(value: T): void {
		if (this.#options.latestOnly) this.#waiting = [value];
		else this.#waiting.push(value);
		if (!untrack(() => this.busy)) void this.#drain();
	}

	async #drain(): Promise<void> {
		this.busy = true;
		try {
			while (this.#waiting.length > 0) {
				const value = this.#waiting.shift() as T;
				const error = await this.#attempt(value);
				this.error = error ?? '';
				if (error !== undefined) this.#waiting = [];
			}
		} finally {
			this.busy = false;
		}
	}

	async #attempt(value: T): Promise<string | undefined> {
		try {
			return await this.#save(value);
		} catch {
			return this.#options.failed ?? '';
		}
	}
}
