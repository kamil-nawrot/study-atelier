import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import QuizTiles from './QuizTiles.svelte';

const titles = ['The Milkmaid', 'The Astronomer', 'The Jewish Bride', 'The Night Watch'];

const quiz: Quiz = {
	answer: 2,
	options: titles.map((title, index) => ({
		label: title,
		artwork: testArtwork(index + 1, title, {
			image: {
				src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
				width: 400 + index * 100,
				height: 500
			}
		})
	}))
};

function renderTiles(chosen?: number): { onanswer: ReturnType<typeof vi.fn> } {
	const onanswer = vi.fn();
	render(QuizTiles, { quiz, chosen, saving: false, onanswer });
	return { onanswer };
}

describe('QuizTiles', () => {
	it('lays out four tiles with their picture ratios', async () => {
		renderTiles();

		await expect
			.element(page.getByRole('list', { name: m.review.quiz.options }))
			.toBeInTheDocument();
		expect(document.querySelectorAll('li.tile')).toHaveLength(4);
		const frame = document.querySelector<HTMLElement>('.tiles-frame')!;
		expect(frame.style.getPropertyValue('--r1')).toBe(String(400 / 500));
		expect(frame.style.getPropertyValue('--r4')).toBe(String(700 / 500));
		expect(Number(frame.style.getPropertyValue('--ratio-sum'))).toBeCloseTo(
			(400 + 500 + 600 + 700) / 500
		);
	});

	it('falls back to a fixed ratio for an option without a picture', async () => {
		render(QuizTiles, {
			quiz: { answer: 0, options: titles.map((label) => ({ label })) },
			saving: false,
			onanswer: vi.fn()
		});

		const frame = document.querySelector<HTMLElement>('.tiles-frame')!;
		expect(frame.style.getPropertyValue('--r1')).toBe('0.8');
		expect(frame.style.getPropertyValue('--ratio-sum')).toBe(String(0.8 * 4));
	});

	it('passes the picked index on', async () => {
		const { onanswer } = renderTiles();

		(
			page
				.getByRole('button', { name: new RegExp(m.review.quiz.imageAlt(3)) })
				.element() as HTMLElement
		).click();

		expect(onanswer).toHaveBeenCalledExactlyOnceWith(2);
	});

	it('opens the viewer on the picture the learner enlarges', async () => {
		renderTiles();

		(
			page.getByRole('button', { name: m.review.quiz.openImage(4) }).element() as HTMLElement
		).click();

		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByRole('dialog')).toHaveAccessibleName(m.review.quiz.imageAlt(4));
	});

	it('describes the enlarged picture by its artwork after the answer', async () => {
		renderTiles(0);

		(
			page.getByRole('button', { name: m.review.quiz.openImage(1) }).element() as HTMLElement
		).click();

		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect
			.element(page.getByRole('dialog'))
			.toHaveAccessibleName('The Milkmaid, Test Painter');
	});
});
