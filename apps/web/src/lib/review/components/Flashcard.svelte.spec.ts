import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testGlossary } from '#lib/testing/glossary.ts';
import type { ReviewItem } from '#lib/review/types.ts';
import Flashcard from './Flashcard.svelte';

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
			.element(page.getByRole('button', { name: m.review.ratings[1], exact: true }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.ratings[2], exact: true }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.ratings[3], exact: true }))
			.toBeVisible();
	});

	it('marks glossary terms in the note and opens their card without a way out of the session', async () => {
		renderCard(true, {
			details: { notes: 'The tympana over the door.', credit: 'Wikimedia Commons' },
			glossary: testGlossary()
		});

		await page.getByRole('button', { name: 'tympana' }).click();

		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Tympanum');
		expect(page.getByRole('link', { name: m.glossary.card.open }).elements()).toHaveLength(0);
	});

	it('opens the image in a full-screen preview and closes it again', async () => {
		renderCard(false);

		(page.getByRole('button', { name: m.artworkView.openImage }).element() as HTMLElement).click();
		const viewer = page.getByRole('dialog');
		await expect.element(viewer).toBeVisible();

		(page.getByRole('button', { name: m.artworkView.closeImage }).element() as HTMLElement).click();
		await expect.element(viewer).not.toBeInTheDocument();
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
