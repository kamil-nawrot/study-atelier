export class FormState<T> {
	busy = $state(false);
	error = $state('');
	saved: T;

	constructor(saved: T) {
		this.saved = $state.raw(saved);
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
