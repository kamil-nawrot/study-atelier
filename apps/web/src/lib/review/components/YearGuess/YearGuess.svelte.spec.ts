import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { YearItem } from '#lib/review/types/year-item.ts';
import YearGuess from './YearGuess.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const today = new Date('2026-11-04T12:00:00.000Z');

function item(yearFrom: number | null, yearTo: number): YearItem {
	return {
		mode: 'year',
		artwork: testArtwork(7, 'Mona Lisa', {
			authors: ['Leonardo da Vinci'],
			eraCode: 'early_modern',
			yearFrom,
			yearTo
		}),
		card: null
	};
}

function renderGuess(
	yearItem: YearItem,
	extra: { guessed?: number; error?: string } = {}
): { onguess: ReturnType<typeof vi.fn>; onnext: ReturnType<typeof vi.fn> } {
	const onguess = vi.fn();
	const onnext = vi.fn();
	render(YearGuess, { item: yearItem, saving: false, today, onguess, onnext, ...extra });
	return { onguess, onnext };
}

describe('YearGuess', () => {
	it('asks for the year within the era without naming the artwork', async () => {
		renderGuess(item(1503, 1519));

		await expect.element(page.getByText(m.review.year.tag)).toBeInTheDocument();
		await expect
			.element(page.getByRole('heading', { name: m.review.year.question }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText(m.review.year.hint('nowożytności', '1492 – 1789')))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('img', { name: m.review.flashcard.imageAlt }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Mona Lisa')).not.toBeInTheDocument();
	});

	it('checks the year the slider starts at, in the middle of the era', async () => {
		const { onguess } = renderGuess(item(1503, 1519));

		await expect
			.element(page.getByRole('slider', { name: m.review.year.slider }))
			.toHaveValue('1641');
		await page.getByRole('button', { name: m.review.year.check }).click();
		expect(onguess).toHaveBeenCalledWith(1641);
	});

	it('says how close a guess after the span was and names the artwork', async () => {
		const { onnext } = renderGuess(item(1503, 1519), { guessed: 1540 });

		await expect.element(page.getByText(m.review.year.results[2])).toBeInTheDocument();
		await expect
			.element(page.getByText(m.review.year.made(m.review.year.when('1503–1519', true))))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.review.year.miss('1540', 21, true))).toBeInTheDocument();
		await expect.element(page.getByText('Mona Lisa')).toBeInTheDocument();
		await expect.element(page.getByText(/Leonardo da Vinci/)).toBeInTheDocument();
		expect(document.querySelector('input[type="range"]')).toBeNull();

		await page.getByRole('button', { name: m.review.quiz.next }).click();
		expect(onnext).toHaveBeenCalledOnce();
	});

	it('knows a guess inside the span', async () => {
		renderGuess(item(1503, 1519), { guessed: 1510 });

		await expect.element(page.getByText(m.review.year.results[3])).toBeInTheDocument();
		await expect.element(page.getByText(m.review.year.inside('1510', true))).toBeInTheDocument();
	});

	it('tells a far guess before a single year', async () => {
		renderGuess(item(null, 1503), { guessed: 1449 });

		await expect
			.element(page.getByText(m.review.year.made(m.review.year.when('1503', false))))
			.toBeInTheDocument();
		await expect.element(page.getByText(m.review.year.miss('1449', 54, false))).toBeInTheDocument();
	});

	it('shows why an answer was not saved', async () => {
		renderGuess(item(1503, 1519), { error: 'Not saved.' });

		await expect.element(page.getByText('Not saved.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: m.review.year.check })).toBeEnabled();
	});
});
