import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { RelationItem } from '#lib/review/types/relation-item.ts';
import RelationQuiz from './RelationQuiz.svelte';

const options = ['Madonna Litta', 'The Kiss', 'Olympia', 'Danaë'].map((label) => ({ label }));

function item(overrides: Partial<RelationItem> = {}): RelationItem {
	return {
		mode: 'quiz_relation',
		question: 'studyFrom',
		key: 'artwork:a1|a2',
		artwork: testArtwork(1, 'Head of a Woman'),
		quiz: { answer: 0, options },
		...overrides
	};
}

function renderQuiz(
	relation: RelationItem,
	chosen?: number
): { onanswer: ReturnType<typeof vi.fn>; onnext: ReturnType<typeof vi.fn> } {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(RelationQuiz, { item: relation, chosen, onanswer, onnext });
	return { onanswer, onnext };
}

describe('RelationQuiz', () => {
	it('asks the question of the relation about the artwork shown', async () => {
		const { onanswer } = renderQuiz(item());

		await expect.element(page.getByText(m.review.quiz.relationTag)).toBeVisible();
		await expect
			.element(
				page.getByRole('heading', {
					name: `${m.review.quiz.relationQuestions.studyFrom} Head of a Woman?`
				})
			)
			.toBeVisible();

		await page.getByRole('button', { name: /The Kiss/ }).click();
		expect(onanswer).toHaveBeenCalledWith(1);
	});

	it('asks about the author of the artwork shown and names the right answer after a wrong one', async () => {
		const { onnext } = renderQuiz(
			item({ question: 'pupilFrom', author: 'Leonardo da Vinci', key: 'author:l|v' }),
			2
		);

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.pupilQuestions.pupilFrom }))
			.toBeVisible();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.wrong} Madonna Litta.`);
		await expect.element(page.getByText(m.review.quiz.relationRetry)).toBeVisible();

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalled();
	});
});
