import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { PairItem } from '#lib/review/types/pair-item.ts';
import PairQuiz from './PairQuiz.svelte';

const item: PairItem = {
	mode: 'quiz_pair',
	kind: 'style',
	key: 'style:impressionism|realism',
	asked: 'Impressionism',
	other: 'Realism',
	quiz: {
		answer: 1,
		options: [testArtwork(2, 'Stones'), testArtwork(1, 'Impression')].map((artwork) => ({
			label: artwork.title,
			artwork
		}))
	}
};

function renderQuiz(chosen?: number): {
	onanswer: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(PairQuiz, { item, chosen, onanswer, onnext });
	return { onanswer, onnext };
}

describe('PairQuiz', () => {
	it('labels the extra question and asks for the artwork of one value of the pair', async () => {
		const { onanswer } = renderQuiz();

		await expect.element(page.getByText(m.review.quiz.pairTag)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.pairQuestion }))
			.toBeVisible();
		await expect
			.element(page.getByText(m.review.quiz.pairValue.style('Impressionism')))
			.toBeVisible();
		await expect.element(page.getByRole('listitem')).toHaveLength(2);

		(
			page
				.getByRole('button', { name: m.review.quiz.imageAlt(1), exact: true })
				.element() as HTMLElement
		).click();
		expect(onanswer).toHaveBeenCalledWith(0);
	});

	it('names the right artwork and the other value after a wrong answer and moves on', async () => {
		const { onnext } = renderQuiz(0);

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(
				`${m.review.quiz.wrong} Impression. ${m.review.quiz.pairOther.style('Realism')} ${m.review.quiz.pairRetry}`
			);

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalled();
	});
});
