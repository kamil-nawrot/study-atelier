import { describe, expect, it, vi } from 'vitest';
import { pendingAnswer } from './pending-answer.ts';

describe('pendingAnswer', () => {
	it('opens the question once and gives every caller the same answer', async () => {
		const open = vi.fn();
		const question = pendingAnswer();

		const first = question.ask(open);
		const second = question.ask(open);
		question.answer(true);

		expect(open).toHaveBeenCalledTimes(1);
		expect(question.pending).toBe(false);
		await expect(first).resolves.toBe(true);
		await expect(second).resolves.toBe(true);
	});

	it('asks again after an answer', async () => {
		const open = vi.fn();
		const question = pendingAnswer();

		const first = question.ask(open);
		question.answer(false);
		const second = question.ask(open);
		question.answer(true);

		expect(open).toHaveBeenCalledTimes(2);
		await expect(first).resolves.toBe(false);
		await expect(second).resolves.toBe(true);
	});

	it('ignores an answer when nothing is asked', () => {
		const question = pendingAnswer();

		expect(() => question.answer(true)).not.toThrow();
		expect(question.pending).toBe(false);
	});
});
