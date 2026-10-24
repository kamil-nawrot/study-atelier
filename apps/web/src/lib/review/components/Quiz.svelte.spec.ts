import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { Quiz as QuizData, QuizMode, ReviewItem, ReviewPin } from '#lib/review/types.ts';
import Quiz from './Quiz.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const answer = testArtwork(31, 'Girl with a Pearl Earring', {
	authors: ['Johannes Vermeer'],
	date: 'ok. 1665',
	styles: ['Dutch Golden Age']
});
const milkmaid = testArtwork(32, 'The Milkmaid', { authors: ['Johannes Vermeer'] });
const bride = testArtwork(33, 'The Jewish Bride', { authors: ['Rembrandt'] });
const astronomer = testArtwork(34, 'The Astronomer', { authors: ['Johannes Vermeer'] });

const artworkQuiz: QuizData = {
	answer: 2,
	options: [
		{ label: milkmaid.title, artwork: milkmaid, reason: 'author' },
		{ label: bride.title, artwork: bride, reason: 'style' },
		{ label: answer.title, artwork: answer },
		{ label: astronomer.title, artwork: astronomer, reason: 'author' }
	]
};

const styleQuiz: QuizData = {
	answer: 0,
	options: ['Dutch Golden Age', 'Mannerism', 'Caravaggism', 'Rococo'].map((label) => ({ label }))
};

const termQuiz: QuizData = {
	answer: 1,
	options: ['Nave', 'Apse', 'Choir', 'Portal'].map((label) => ({ label }))
};

const pin: ReviewPin = {
	x: 0.25,
	y: 0.75,
	image: {
		kind: 'url',
		url: 'https://images.example.test/detail.jpg',
		width: 800,
		height: 600,
		id: 'image-2'
	}
};

function renderQuiz(
	mode: QuizMode,
	quiz: QuizData,
	chosen?: number,
	extra: Partial<ReviewItem> = {}
): { onanswer: ReturnType<typeof vi.fn>; onnext: ReturnType<typeof vi.fn> } {
	const onanswer = vi.fn();
	const onnext = vi.fn();
	const item: ReviewItem & { quiz: QuizData } = {
		artwork: answer,
		card: null,
		mode,
		quiz,
		...extra
	};
	render(Quiz, {
		item,
		details: { notes: '', credit: 'Wikimedia Commons' },
		chosen,
		saving: false,
		onanswer,
		onnext
	});
	return { onanswer, onnext };
}

describe('Quiz', () => {
	it('asks where an artwork is among four images that name nothing yet', async () => {
		await page.viewport(1280, 800);
		const { onanswer } = renderQuiz('quiz_image', artworkQuiz);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(`${m.review.quiz.imageQuestion.start} ${answer.title}?`);
		const options = page
			.getByRole('list', { name: m.review.quiz.options })
			.getByRole('button', { name: /^Obraz \d$/ });
		expect(options.elements()).toHaveLength(4);
		await expect
			.element(page.getByRole('img', { name: m.review.quiz.imageAlt(1) }))
			.toBeInTheDocument();
		expect(document.body.textContent).not.toContain(milkmaid.title);

		await userEvent.keyboard('3');
		expect(onanswer).toHaveBeenCalledWith(2);
	});

	it('enlarges one of the four images without answering', async () => {
		await page.viewport(1280, 800);
		const { onanswer } = renderQuiz('quiz_image', artworkQuiz);

		(
			page.getByRole('button', { name: m.review.quiz.openImage(2) }).element() as HTMLElement
		).click();
		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(onanswer).not.toHaveBeenCalled();
	});

	it('enlarges the image of a title question', async () => {
		renderQuiz('quiz_title', artworkQuiz);

		(page.getByRole('button', { name: m.artworkView.openImage }).element() as HTMLElement).click();
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});

	it('keeps the next button in its place but disabled until the answer', async () => {
		const { onnext } = renderQuiz('quiz_image', artworkQuiz);

		await expect.element(page.getByRole('button', { name: m.review.quiz.next })).toBeDisabled();
		await userEvent.keyboard('{Enter}');
		expect(onnext).not.toHaveBeenCalled();
	});

	it('marks the right image, names the wrong pick and says why the others were close', async () => {
		const { onnext } = renderQuiz('quiz_image', artworkQuiz, 0);

		const status = page.getByRole('status');
		await expect
			.element(status)
			.toHaveTextContent(`${m.review.quiz.wrong} ${milkmaid.title}. ${m.review.quiz.marked}`);
		await expect.element(status).toHaveTextContent(m.review.quiz.retry);
		await expect
			.element(page.getByRole('button', { name: new RegExp(m.review.quiz.rightOption) }))
			.toBeDisabled();
		await expect
			.element(page.getByText(`Johannes Vermeer · 1900 · ${m.review.quiz.reasons.author}`).first())
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.quiz.next })).toHaveFocus();

		await userEvent.keyboard('{Enter}');
		expect(onnext).toHaveBeenCalledOnce();
	});

	it('asks for the title next to the image and confirms a right answer', async () => {
		renderQuiz('quiz_title', artworkQuiz, 2);

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.titleQuestion }))
			.toBeVisible();
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.right} ${answer.title}. Johannes Vermeer, ok. 1665.`);
		await expect.element(page.getByRole('status')).not.toHaveTextContent(m.review.quiz.retry);
		await expect.element(page.getByText('Wikimedia Commons')).toBeVisible();
	});

	it('marks why a wrong title was close with an icon that explains itself on hover', async () => {
		renderQuiz('quiz_title', artworkQuiz, 0);

		const reason = page.getByRole('img', { name: m.review.quiz.reasons.author }).first();
		await expect.element(reason).toBeVisible();
		await userEvent.hover(reason);
		await expect
			.element(page.getByRole('tooltip', { name: m.review.quiz.reasonLabels.author }).first())
			.toBeVisible();
	});

	it('asks for the style and hides the credit until the answer', async () => {
		const { onanswer } = renderQuiz('quiz_style', styleQuiz);

		await expect
			.element(page.getByRole('heading', { name: m.review.quiz.styleQuestion }))
			.toBeVisible();
		await expect
			.element(page.getByRole('img', { name: m.review.flashcard.imageAlt }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Wikimedia Commons')).not.toBeInTheDocument();

		await page.getByRole('button', { name: /Caravaggism/ }).click();
		expect(onanswer).toHaveBeenCalledWith(2);
	});

	it('asks what the marked place of a pinned image is', async () => {
		await page.viewport(1280, 800);
		const { onanswer } = renderQuiz('quiz_pin', termQuiz, undefined, { pin });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.review.quiz.pinQuestion);
		await expect.element(page.getByText(m.review.quiz.pinHint)).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: m.review.flashcard.imageAlt }))
			.toHaveAttribute('src', 'https://images.example.test/detail.jpg');
		const mark = document.querySelector<HTMLElement>('.mark');
		expect(mark?.style.left).toBe('25%');
		expect(mark?.style.top).toBe('75%');
		expect(
			page
				.getByRole('list', { name: m.review.quiz.options })
				.getByRole('button')
				.elements()
				.map((button) => button.textContent?.trim())
		).toEqual(['1 Nave', '2 Apse', '3 Choir', '4 Portal']);

		await userEvent.keyboard('2');
		expect(onanswer).toHaveBeenCalledWith(1);
	});

	it('names the right term and the artwork after a pin question', async () => {
		await page.viewport(1280, 800);
		renderQuiz('quiz_pin', termQuiz, 0, { pin });

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(`${m.review.quiz.wrong} Apse.`);
		await expect.element(page.getByRole('status')).toHaveTextContent(answer.title);
		await expect
			.element(page.getByText(m.artworkForm.ownImageUrlCredit('images.example.test')))
			.toBeVisible();
	});
});
