import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testReviewCard } from '#lib/testing/review.ts';
import type { ReviewItem } from '../types.ts';
import Flashcard from './Flashcard.svelte';

const now = new Date(2026, 9, 16, 9, 0);

const item: ReviewItem = {
	artwork: testArtwork(31, 'Girl with a Pearl Earring', {
		authors: ['Johannes Vermeer'],
		date: 'ok. 1665',
		period: 'Baroque',
		styles: ['Dutch Golden Age'],
		location: 'Mauritshuis'
	}),
	card: null,
	mode: 'flashcard'
};

const outcomes = {
	1: testReviewCard('artwork-31', new Date(2026, 9, 16, 9, 1)),
	2: testReviewCard('artwork-31', new Date(2026, 9, 17, 9, 0)),
	3: testReviewCard('artwork-31', new Date(2026, 9, 21, 9, 0))
};

function renderCard(
	revealed: boolean,
	extra: Record<string, unknown> = {}
): {
	onreveal: ReturnType<typeof vi.fn>;
	onrate: ReturnType<typeof vi.fn>;
} {
	const onreveal = vi.fn();
	const onrate = vi.fn();
	render(Flashcard, {
		item,
		details: { notes: 'A study of a face in a turban.', credit: 'Wikimedia Commons' },
		revealed,
		outcomes,
		now,
		saving: false,
		onreveal,
		onrate,
		...extra
	});
	return { onreveal, onrate };
}

describe('Flashcard', () => {
	it('asks without naming the artwork anywhere before the card is revealed', async () => {
		renderCard(false);

		await expect
			.element(page.getByRole('heading', { name: m.review.flashcard.question }))
			.toBeVisible();
		await expect.element(page.getByText(m.review.flashcard.hint)).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: m.review.flashcard.imageAlt }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Girl with a Pearl Earring')).not.toBeInTheDocument();
		await expect.element(page.getByText('#0031')).not.toBeInTheDocument();
		await expect.element(page.getByText('Wikimedia Commons')).not.toBeInTheDocument();
	});

	it('reveals the card with the button and with the space bar', async () => {
		const { onreveal } = renderCard(false);

		await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
		expect(onreveal).toHaveBeenCalledTimes(1);

		(document.activeElement as HTMLElement | null)?.blur();
		await userEvent.keyboard(' ');
		expect(onreveal).toHaveBeenCalledTimes(2);
	});

	it('shows the answer, the note, the credit and when each rating brings the artwork back', async () => {
		renderCard(true);

		await expect
			.element(page.getByRole('heading', { name: 'Girl with a Pearl Earring' }))
			.toBeVisible();
		await expect.element(page.getByText('#0031')).toBeVisible();
		await expect.element(page.getByText('Johannes Vermeer')).toBeVisible();
		await expect.element(page.getByText('Mauritshuis')).toBeVisible();
		await expect.element(page.getByText('A study of a face in a turban.')).toBeVisible();
		await expect.element(page.getByText('Wikimedia Commons')).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: 'Girl with a Pearl Earring, Johannes Vermeer' }))
			.toBeInTheDocument();
		await expect
			.element(
				page.getByRole('button', { name: `${m.review.ratings[1]} ${m.review.interval.today}` })
			)
			.toBeVisible();
		await expect
			.element(
				page.getByRole('button', { name: `${m.review.ratings[2]} ${m.review.interval.tomorrow}` })
			)
			.toBeVisible();
		await expect
			.element(
				page.getByRole('button', { name: `${m.review.ratings[3]} ${m.review.interval.days(5)}` })
			)
			.toBeVisible();
	});

	it('rates with the buttons and with the keys 1 to 3', async () => {
		const { onrate } = renderCard(true);

		await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[2]}`) }).click();
		expect(onrate).toHaveBeenLastCalledWith(2);

		await userEvent.keyboard('1');
		expect(onrate).toHaveBeenLastCalledWith(1);
		await userEvent.keyboard('3');
		expect(onrate).toHaveBeenLastCalledWith(3);
	});

	it('keeps the ratings disabled while saving and shows a failed save', async () => {
		const { onrate } = renderCard(true, { saving: true, error: m.review.saveFailed });

		await expect.element(page.getByText(m.review.saveFailed)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: new RegExp(`^${m.review.ratings[3]}`) }))
			.toBeDisabled();
		await userEvent.keyboard('3');
		expect(onrate).not.toHaveBeenCalled();
	});
});
