import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
import SymbolQuiz from './SymbolQuiz.svelte';

const item: SymbolItem = {
	mode: 'quiz_symbol',
	kind: 'meaning',
	key: 'pin-1:meaning',
	lens: { thumbnail: { left: 0, top: 0, width: 100, height: 100 } },
	quiz: {
		answer: 0,
		options: ['Power of the Church', 'Purity', 'Transience', 'Peace'].map((label) => ({ label }))
	}
};

function renderQuiz(chosen?: number): {
	onanswer: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(SymbolQuiz, { item, chosen, onanswer, onnext });
	return { onanswer, onnext };
}

describe('SymbolQuiz', () => {
	it('labels the extra question and asks the question of its kind', async () => {
		const { onanswer } = renderQuiz();

		await expect.element(page.getByText(m.review.quiz.symbolTag)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.symbolQuestions.meaning }))
			.toBeVisible();

		await page.getByRole('button', { name: /Purity/ }).click();
		expect(onanswer).toHaveBeenCalledWith(1);
	});

	it('names the right answer after a wrong one and moves on', async () => {
		const { onnext } = renderQuiz(1);

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.wrong} Power of the Church.`);
		await expect.element(page.getByText(m.review.quiz.symbolRetry)).toBeVisible();

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalled();
	});
});
