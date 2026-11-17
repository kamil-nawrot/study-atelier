import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import QuizChoiceState from './QuizChoiceState.svelte';

describe('QuizChoiceState', () => {
	it('says nothing before an answer is chosen', async () => {
		const { container } = await render(QuizChoiceState, { index: 0, answer: 0 });

		expect(container.textContent?.trim()).toBe('');
	});

	it('tells a screen reader which option is right', async () => {
		render(QuizChoiceState, { index: 1, answer: 1, chosen: 1 });

		await expect.element(page.getByText(m.review.quiz.rightOption)).toBeInTheDocument();
		await expect.element(page.getByText(m.review.quiz.chosenOption)).not.toBeInTheDocument();
	});

	it('tells a screen reader which option was chosen wrongly', async () => {
		render(QuizChoiceState, { index: 2, answer: 1, chosen: 2 });

		await expect.element(page.getByText(m.review.quiz.chosenOption)).toBeInTheDocument();
		await expect.element(page.getByText(m.review.quiz.rightOption)).not.toBeInTheDocument();
	});

	it('names the right option only after an answer, and stays silent on the others', async () => {
		render(QuizChoiceState, { index: 0, answer: 1, chosen: 3 });

		await expect.element(page.getByText(m.review.quiz.rightOption)).not.toBeInTheDocument();
		await expect.element(page.getByText(m.review.quiz.chosenOption)).not.toBeInTheDocument();
	});
});
