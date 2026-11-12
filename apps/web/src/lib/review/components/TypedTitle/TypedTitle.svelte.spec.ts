import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import TypedTitle from './TypedTitle.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const asked = testArtwork(1, 'Autoportret', { id: 'gogh', authors: ['Vincent van Gogh'] });
const artworks = [
	asked,
	testArtwork(2, 'Autoportret', { id: 'rembrandt', authors: ['Rembrandt van Rijn'] })
];
const item: ReviewItem = { artwork: asked, card: null, mode: 'quiz_typed' };

function renderCard(typed?: readonly string[]): {
	onanswer: ReturnType<typeof vi.fn>;
	onnext: ReturnType<typeof vi.fn>;
} {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	render(TypedTitle, { item, artworks, typed, saving: false, onanswer, onnext });
	return { onanswer, onnext };
}

describe('TypedTitle', () => {
	it('asks for the title and checks the artwork picked', async () => {
		const card = renderCard();

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.typedQuestion }))
			.toBeVisible();
		await expect.element(page.getByText(m.review.quiz.typedHint)).toBeVisible();
		const check = page.getByRole('button', { name: m.review.quiz.typedCheck });
		await expect.element(check).toBeDisabled();
		await page.getByRole('combobox', { name: m.review.quiz.typedLabel }).fill('auto');
		await page.getByRole('option', { name: /Rembrandt/ }).click();
		await check.click();

		expect(card.onanswer).toHaveBeenCalledWith(['rembrandt']);
	});

	it('shrinks the artwork to a strip while the learner types', async () => {
		renderCard();
		const stage = page.getByRole('figure');

		await expect.element(stage).not.toHaveClass('collapsed');
		await page.getByRole('combobox', { name: m.review.quiz.typedLabel }).click();

		await expect.element(stage).toHaveClass('collapsed');
	});

	it('names the artwork after a wrong answer and says it comes back', async () => {
		const card = renderCard(['rembrandt']);

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.wrong} Autoportret, Vincent van Gogh.`);
		await expect.element(page.getByText(m.review.quiz.retry)).toBeVisible();
		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(card.onnext).toHaveBeenCalledOnce();
	});

	it('confirms a right answer', async () => {
		renderCard(['gogh']);

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.right} Autoportret, Vincent van Gogh.`);
		await expect.element(page.getByText(m.review.quiz.retry)).not.toBeInTheDocument();
	});
});
