import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import ReviewCard from './ReviewCard.svelte';

function text(content: string): ReturnType<typeof createRawSnippet> {
	return createRawSnippet(() => ({ render: () => `<p>${content}</p>` }));
}

const base = {
	alt: 'Artwork to recognise',
	labelledby: 'card-heading',
	artwork: testArtwork(1, 'The Milkmaid'),
	body: createRawSnippet(() => ({
		render: () => '<h2 id="card-heading">Question</h2>'
	}))
};

describe('ReviewCard', () => {
	it('shows the artwork image beside a panel labelled by the question', async () => {
		await page.viewport(1280, 800);
		render(ReviewCard, base);

		await expect.element(page.getByRole('img', { name: 'Artwork to recognise' })).toBeVisible();
		await expect.element(page.getByRole('region', { name: 'Question' })).toBeVisible();
	});

	it('renders the actions below the body', async () => {
		render(ReviewCard, { ...base, actions: text('Rate it') });

		await expect.element(page.getByText('Rate it')).toBeVisible();
		expect(document.querySelector('.actions')).not.toBeNull();
	});

	it('replaces the artwork with a custom stage', async () => {
		render(ReviewCard, { ...base, stage: text('Custom stage') });

		await expect.element(page.getByText('Custom stage')).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: 'Artwork to recognise' }))
			.not.toBeInTheDocument();
	});

	it('renders no actions area without actions', () => {
		render(ReviewCard, base);

		expect(document.querySelector('.actions')).toBeNull();
	});

	it('marks the card as compact', () => {
		render(ReviewCard, { ...base, compact: true });

		expect(document.querySelector('.card.compact')).not.toBeNull();
	});

	it('keeps the image first on a desktop even when the question comes first', async () => {
		await page.viewport(1280, 800);
		render(ReviewCard, { ...base, questionFirst: true });

		expect(document.querySelector('.question-first')).toBeNull();
		const card = document.querySelector('.card') as HTMLElement;
		expect(card.firstElementChild?.classList.contains('stage')).toBe(true);
	});

	it('puts the question above the image on a phone when the question comes first', async () => {
		await page.viewport(390, 844);
		render(ReviewCard, { ...base, questionFirst: true });

		const panel = document.querySelector('.question-first .panel') as HTMLElement;
		expect(panel.firstElementChild?.classList.contains('body')).toBe(true);
		expect(panel.querySelector('.stage')).not.toBeNull();
	});

	it('keeps the image first on a phone when the question does not come first', async () => {
		await page.viewport(390, 844);
		render(ReviewCard, base);

		expect(document.querySelector('.question-first')).toBeNull();
	});
});
