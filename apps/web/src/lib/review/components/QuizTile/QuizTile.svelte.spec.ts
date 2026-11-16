import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { QuizOption } from '#lib/review/types/quiz-option.ts';
import QuizTile from './QuizTile.svelte';

const milkmaid = testArtwork(1, 'The Milkmaid', { authors: ['Johannes Vermeer'], date: '1658' });
const option: QuizOption = { label: milkmaid.title, artwork: milkmaid, reason: 'author' };

function renderTile(
	props: {
		chosen?: number;
		index?: number;
		answer?: number;
		saving?: boolean;
		option?: QuizOption;
	} = {}
): { onanswer: ReturnType<typeof vi.fn>; onenlarge: ReturnType<typeof vi.fn> } {
	const onanswer = vi.fn();
	const onenlarge = vi.fn();
	render(QuizTile, {
		option,
		index: 1,
		answer: 1,
		ratio: 0.8,
		saving: false,
		onanswer,
		onenlarge,
		...props
	});
	return { onanswer, onenlarge };
}

describe('QuizTile', () => {
	it('names no artwork before the answer, only its position', async () => {
		renderTile();

		await expect
			.element(page.getByRole('img', { name: m.review.quiz.imageAlt(2) }))
			.toBeInTheDocument();
		await expect.element(page.getByText('The Milkmaid')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: new RegExp(m.review.quiz.imageAlt(2)) }))
			.toHaveAttribute('aria-keyshortcuts', '2');
	});

	it('reports the index of the picked tile', async () => {
		const { onanswer } = renderTile({ index: 3, answer: 0 });

		(
			page
				.getByRole('button', { name: new RegExp(m.review.quiz.imageAlt(4)) })
				.element() as HTMLElement
		).click();

		expect(onanswer).toHaveBeenCalledExactlyOnceWith(3);
	});

	it('cannot be picked while an answer is being saved', async () => {
		renderTile({ saving: true });

		await expect
			.element(page.getByRole('button', { name: new RegExp(m.review.quiz.imageAlt(2)) }))
			.toBeDisabled();
	});

	it('names the artwork, its author, date and why it was offered after the answer', async () => {
		renderTile({ chosen: 1 });

		expect(document.querySelector('cite')?.textContent).toBe('The Milkmaid');
		expect(document.querySelector('.caption')?.textContent).toBe(
			`Johannes Vermeer · 1658 · ${m.review.quiz.reasons.author}`
		);
		await expect
			.element(page.getByRole('img', { name: 'The Milkmaid, Johannes Vermeer' }))
			.toBeInTheDocument();
	});

	it('marks the right tile and the wrong choice', async () => {
		renderTile({ chosen: 1, answer: 1 });
		expect(document.querySelector('li.right')).not.toBeNull();
		expect(document.querySelector('li.wrong')).toBeNull();
	});

	it('marks a wrong choice as wrong', async () => {
		renderTile({ chosen: 1, answer: 2 });

		expect(document.querySelector('li.wrong')).not.toBeNull();
		expect(document.querySelector('li.right')).toBeNull();
		expect(document.querySelector('li.muted')).toBeNull();
	});

	it('mutes a tile that is neither right nor chosen', async () => {
		renderTile({ chosen: 3, answer: 2, index: 0 });

		expect(document.querySelector('li.muted')).not.toBeNull();
	});

	it('asks to enlarge the image without answering', async () => {
		const { onanswer, onenlarge } = renderTile();

		await page.getByRole('button', { name: m.review.quiz.openImage(2) }).click();

		expect(onenlarge).toHaveBeenCalledExactlyOnceWith(milkmaid.image, m.review.quiz.imageAlt(2));
		expect(onanswer).not.toHaveBeenCalled();
	});

	it('passes the artwork description to the viewer after the answer', async () => {
		const { onenlarge } = renderTile({ chosen: 0, answer: 1 });

		await page.getByRole('button', { name: m.review.quiz.openImage(2) }).click();

		expect(onenlarge).toHaveBeenCalledWith(milkmaid.image, 'The Milkmaid, Johannes Vermeer');
	});

	it('offers no enlarging for an option without an image', async () => {
		renderTile({
			option: { label: 'No picture', artwork: testArtwork(2, 'No picture', { image: undefined }) }
		});

		await expect
			.element(page.getByRole('button', { name: m.review.quiz.openImage(2) }))
			.not.toBeInTheDocument();
	});

	it('shows only the label for an option that has no artwork', async () => {
		renderTile({ option: { label: 'Baroque' }, chosen: 1 });

		expect(document.querySelector('cite')?.textContent).toBe('Baroque');
		expect(document.querySelector('.caption')?.textContent).toBe('');
	});
});
