import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import QuizMark from './QuizMark.svelte';

describe('QuizMark', () => {
	it('numbers the option from one while the question is open', async () => {
		const { container } = await render(QuizMark, { index: 2, answer: 0 });

		expect(container.textContent?.trim()).toBe('3');
		expect(container.querySelector('svg')).toBeNull();
	});

	it('marks the right option with a check once an answer is chosen', async () => {
		const { container } = await render(QuizMark, { index: 1, answer: 1, chosen: 3 });

		expect(container.querySelector('svg')).not.toBeNull();
		expect(container.textContent?.trim()).toBe('');
	});

	it('marks the wrong choice with a cross', async () => {
		const { container } = await render(QuizMark, { index: 3, answer: 1, chosen: 3 });

		expect(container.querySelector('svg.lucide-x')).not.toBeNull();
	});

	it('keeps the number on an option that is neither right nor chosen', async () => {
		const { container } = await render(QuizMark, { index: 0, answer: 1, chosen: 3 });

		expect(container.textContent?.trim()).toBe('1');
	});
});
