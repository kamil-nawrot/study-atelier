export class FormState<T> {
	busy = $state(false);
	error = $state('');
	saved: T;

	readonly #start: T;
	readonly #opened: T;

	constructor(saved: T, opened: T = saved) {
		this.saved = $state.raw(saved);
		this.#start = saved;
		this.#opened = opened;
	}

	get reference(): T {
		return this.saved === this.#start ? this.#opened : this.saved;
	}

	async run(save: () => Promise<void>): Promise<void> {
		if (this.busy) return;
		this.error = '';
		this.busy = true;
		try {
			await save();
		} finally {
			this.busy = false;
		}
	}
}
