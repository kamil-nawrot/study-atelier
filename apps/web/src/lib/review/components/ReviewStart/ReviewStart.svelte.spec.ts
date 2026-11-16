import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { MIN_ARTWORKS } from '#lib/review/queue/queue.ts';
import ReviewStart from './ReviewStart.svelte';

function renderStart(props: Partial<ComponentProps<typeof ReviewStart>> = {}): {
	onstart: ReturnType<typeof vi.fn>;
	onscope: ReturnType<typeof vi.fn>;
	onform: ReturnType<typeof vi.fn>;
} {
	const onstart = vi.fn();
	const onscope = vi.fn();
	const onform = vi.fn();
	render(ReviewStart, {
		known: 3,
		fresh: 2,
		missing: 0,
		scopes: [{ scope: { kind: 'all' }, count: 5 }],
		scope: { kind: 'all' },
		form: 'mixed',
		forms: ['mixed', 'flashcards', 'quizzes'],
		knowledge: { settled: 1, learning: 2, fresh: 3 },
		troubles: [],
		starting: false,
		streak: 0,
		onstart,
		onscope,
		onform,
		...props
	});
	return { onstart, onscope, onform };
}

describe('ReviewStart', () => {
	it('announces how many artworks wait today and how they split', async () => {
		renderStart();

		await expect.element(page.getByRole('heading', { name: m.review.waiting(5) })).toBeVisible();
		await expect.element(page.getByText(m.review.planKnown(3))).toBeVisible();
		await expect.element(page.getByText(m.review.planFresh(2))).toBeVisible();
	});

	it('leaves out a part of the plan that is empty', async () => {
		renderStart({ known: 0, fresh: 4 });

		await expect.element(page.getByText(m.review.planFresh(4))).toBeVisible();
		await expect.element(page.getByText(m.review.planKnown(0))).not.toBeInTheDocument();
	});

	it('starts the round with the start button', async () => {
		const { onstart } = renderStart();

		await page.getByRole('button', { name: m.review.start }).click();

		expect(onstart).toHaveBeenCalledOnce();
	});

	it('disables the button and says so while the round is being prepared', async () => {
		renderStart({ starting: true });

		await expect.element(page.getByRole('button', { name: m.review.preparing })).toBeDisabled();
	});

	it('says when the next artworks come once everything is done', async () => {
		renderStart({ known: 0, fresh: 0, nextWhen: 'jutro' });

		await expect.element(page.getByRole('heading', { name: m.review.allDoneTitle })).toBeVisible();
		await expect.element(page.getByText(m.review.allDone('jutro'))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
	});

	it('offers a free round when nothing is planned but a free round is open', async () => {
		const { onstart } = renderStart({ known: 0, fresh: 0, free: true });

		await expect.element(page.getByText(m.review.freeHint)).toBeVisible();
		await page.getByRole('button', { name: m.review.free }).click();

		expect(onstart).toHaveBeenCalledOnce();
	});

	it('explains how many artworks are missing and links to adding one', async () => {
		renderStart({ known: 0, fresh: 0, missing: 2 });

		await expect
			.element(page.getByRole('heading', { name: m.review.tooFewTitle(MIN_ARTWORKS) }))
			.toBeVisible();
		await expect.element(page.getByText(m.review.tooFew(MIN_ARTWORKS, 2))).toBeVisible();
		await expect.element(page.getByRole('link', { name: m.atelier.add })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.review.allDoneTitle }))
			.not.toBeInTheDocument();
	});

	it('shows the streak only for a running streak', async () => {
		renderStart({ streak: 3, reviewedToday: true });

		await expect.element(page.getByText(m.review.streakCaption)).toBeVisible();
	});

	it('hides the streak without one', async () => {
		renderStart({ streak: 0 });

		await expect.element(page.getByText(m.review.streakCaption)).not.toBeInTheDocument();
	});

	it('shows a start error above the button', async () => {
		renderStart({ error: 'Network is down' });

		await expect.element(page.getByText(m.review.startErrorTitle)).toBeVisible();
		await expect.element(page.getByText('Network is down')).toBeVisible();
	});

	it('hides the scope choice when there is only one scope', async () => {
		renderStart();

		await page.getByText(m.review.options).click();

		await expect.element(page.getByText(m.review.form, { exact: true })).toBeVisible();
		await expect.element(page.getByText(m.review.scope)).not.toBeInTheDocument();
	});

	it('lets the learner choose a scope and a form', async () => {
		const { onscope, onform } = renderStart({
			scopes: [
				{ scope: { kind: 'all' }, count: 5 },
				{ scope: { kind: 'seen' }, count: 2 },
				{ scope: { kind: 'era', code: 'modern' }, count: 1 },
				{ scope: { kind: 'style', name: 'Baroque' }, count: 2 }
			]
		});

		await page.getByText(m.review.options).click();
		await expect.element(page.getByText(m.review.scope)).toBeVisible();
		await page.getByRole('button', { name: new RegExp(m.atelier.filters.fields.seen) }).click();
		await page.getByRole('button', { name: new RegExp('Baroque') }).click();
		await page.getByRole('button', { name: m.review.forms.quizzes }).click();

		expect(onscope).toHaveBeenCalledWith({ kind: 'seen' });
		expect(onscope).toHaveBeenCalledWith({ kind: 'style', name: 'Baroque' });
		expect(onform).toHaveBeenCalledExactlyOnceWith('quizzes');
	});

	it('describes the chosen form', async () => {
		renderStart({ form: 'flashcards' });

		await page.getByText(m.review.options).click();

		await expect.element(page.getByText(m.review.formHints.flashcards)).toBeVisible();
	});

	it('lists what gave trouble with the knowledge of the atelier', async () => {
		renderStart({ troubles: [testArtwork(9, 'The Milkmaid')] });

		await expect.element(page.getByRole('heading', { name: m.review.knowledge })).toBeVisible();
		await expect.element(page.getByText('The Milkmaid')).toBeVisible();
	});
});
