import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { FormState } from './form-state.svelte.ts';

function deferred(): { promise: Promise<void>; resolve: () => void } {
	let resolve = (): void => {};
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

describe('FormState', () => {
	it('keeps the saved snapshot it was given', () => {
		const state = new FormState({ title: 'Mona Lisa' });

		expect(state.saved).toEqual({ title: 'Mona Lisa' });
	});

	it('tells readers when a new snapshot is saved', () => {
		const state = new FormState({ title: 'Mona Lisa' });
		let seen = '';
		const stop = $effect.root(() => {
			$effect(() => {
				seen = state.saved.title;
			});
		});
		flushSync();

		state.saved = { title: 'The Night Watch' };
		flushSync();

		expect(seen).toBe('The Night Watch');
		stop();
	});

	it('is busy while the save runs and clears the previous error', async () => {
		const state = new FormState(null);
		state.error = 'The server did not answer.';
		const save = deferred();

		const running = state.run(() => save.promise);

		expect(state.busy).toBe(true);
		expect(state.error).toBe('');
		save.resolve();
		await running;
		expect(state.busy).toBe(false);
	});

	it('ignores a second submit while the first one runs', async () => {
		const state = new FormState(null);
		const save = deferred();
		let calls = 0;

		const first = state.run(() => {
			calls += 1;
			return save.promise;
		});
		await state.run(async () => {
			calls += 1;
		});
		save.resolve();
		await first;

		expect(calls).toBe(1);
	});

	it('is no longer busy when the save throws', async () => {
		const state = new FormState(null);

		await expect(
			state.run(async () => {
				throw new Error('Network down');
			})
		).rejects.toThrow('Network down');

		expect(state.busy).toBe(false);
	});

	it('keeps an error set by the save', async () => {
		const state = new FormState(null);

		await state.run(async () => {
			state.error = 'The server did not answer.';
		});

		expect(state.error).toBe('The server did not answer.');
	});
});
