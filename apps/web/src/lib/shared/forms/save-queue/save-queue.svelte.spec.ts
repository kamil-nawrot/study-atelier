import { describe, expect, it, vi } from 'vitest';
import { SaveQueue } from './save-queue.svelte.ts';

function deferred(): { promise: Promise<string | undefined>; resolve: (error?: string) => void } {
	let resolve: (error?: string) => void = () => {};
	const promise = new Promise<string | undefined>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

describe('SaveQueue', () => {
	it('saves the values one after another in the order they came', async () => {
		const first = deferred();
		const saved: string[] = [];
		const save = vi.fn(async (value: string) => {
			saved.push(value);
			return value === 'a' ? first.promise : undefined;
		});
		const queue = new SaveQueue(save);

		queue.push('a');
		queue.push('b');
		expect(saved).toEqual(['a']);
		expect(queue.busy).toBe(true);
		first.resolve();

		await vi.waitFor(() => expect(queue.busy).toBe(false));
		expect(saved).toEqual(['a', 'b']);
		expect(queue.error).toBe('');
	});

	it('keeps the error and drops what waited after a failed save', async () => {
		const first = deferred();
		const save = vi.fn(async (value: string) => (value === 'a' ? first.promise : undefined));
		const queue = new SaveQueue(save);

		queue.push('a');
		queue.push('b');
		first.resolve('Brak sieci.');

		await vi.waitFor(() => expect(queue.busy).toBe(false));
		expect(queue.error).toBe('Brak sieci.');
		expect(save).toHaveBeenCalledTimes(1);
	});

	it('clears the error after the next successful save', async () => {
		const save = vi.fn(async (value: string) => (value === 'bad' ? 'Brak sieci.' : undefined));
		const queue = new SaveQueue(save);

		queue.push('bad');
		await vi.waitFor(() => expect(queue.error).toBe('Brak sieci.'));
		queue.push('good');

		await vi.waitFor(() => expect(queue.error).toBe(''));
	});
});
