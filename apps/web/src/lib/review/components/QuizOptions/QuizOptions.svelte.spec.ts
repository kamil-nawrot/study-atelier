import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import QuizOptions from './QuizOptions.svelte';

const termQuiz: Quiz = {
	answer: 1,
	options: ['Nave', 'Apse', 'Choir', 'Portal'].map((label) => ({ label }))
};

const artworkQuiz: Quiz = {
	answer: 0,
	options: [
		{ label: 'The Milkmaid', artwork: testArtwork(1, 'The Milkmaid') },
		{ label: 'The Astronomer', artwork: testArtwork(2, 'The Astronomer'), reason: 'author' },
		{ label: 'The Jewish Bride', artwork: testArtwork(3, 'The Jewish Bride'), reason: 'style' },
		{ label: 'The Night Watch', artwork: testArtwork(4, 'The Night Watch'), reason: 'period' }
	]
};

function renderOptions(
	quiz: Quiz,
	chosen?: number,
	saving = false
): { onanswer: ReturnType<typeof vi.fn> } {
	const onanswer = vi.fn();
	render(QuizOptions, { quiz, chosen, saving, onanswer });
	return { onanswer };
}

describe('QuizOptions', () => {
	it('lists the four options with their number shortcuts', async () => {
		renderOptions(termQuiz);

		await expect.element(page.getByRole('list', { name: m.review.quiz.options })).toBeVisible();
		for (const [index, label] of ['Nave', 'Apse', 'Choir', 'Portal'].entries()) {
			const option = page.getByRole('button', { name: new RegExp(label) });
			await expect.element(option).toBeEnabled();
			await expect.element(option).toHaveAttribute('aria-keyshortcuts', String(index + 1));
		}
	});

	it('reports the index of the clicked option', async () => {
		const { onanswer } = renderOptions(termQuiz);

		await page.getByRole('button', { name: /Choir/ }).click();

		expect(onanswer).toHaveBeenCalledExactlyOnceWith(2);
	});

	it('disables every option once an answer is chosen and shows the verdict', async () => {
		renderOptions(termQuiz, 3);

		for (const label of ['Nave', 'Apse', 'Choir', 'Portal']) {
			await expect.element(page.getByRole('button', { name: new RegExp(label) })).toBeDisabled();
		}
		await expect
			.element(page.getByRole('button', { name: new RegExp(m.review.quiz.rightOption) }))
			.toHaveTextContent('Apse');
		await expect
			.element(page.getByRole('button', { name: new RegExp(m.review.quiz.chosenOption) }))
			.toHaveTextContent('Portal');
	});

	it('disables the options while an answer is being saved', async () => {
		renderOptions(termQuiz, undefined, true);

		await expect.element(page.getByRole('button', { name: /Nave/ })).toBeDisabled();
	});

	it('hides why an option was offered until the answer is chosen', () => {
		renderOptions(artworkQuiz);

		expect(document.querySelectorAll('.reason-icon')).toHaveLength(0);
	});

	it('explains why each wrong option was offered after the answer', () => {
		renderOptions(artworkQuiz, 0);

		const labels = [...document.querySelectorAll('.reason-icon svg')].map((icon) =>
			icon.getAttribute('aria-label')
		);
		expect(labels).toEqual([
			m.review.quiz.reasons.author,
			m.review.quiz.reasons.style,
			m.review.quiz.reasons.period
		]);
	});

	it('titles artwork options', () => {
		renderOptions(artworkQuiz);

		expect(document.querySelectorAll('.label cite.artwork-title')).toHaveLength(4);
	});

	it('does not title non-artwork options', () => {
		renderOptions(termQuiz);

		expect(document.querySelectorAll('cite')).toHaveLength(0);
	});
});
