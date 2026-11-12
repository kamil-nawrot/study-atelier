import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import NoteGapCard from './NoteGapCard.svelte';

const note = createRawSnippet(() => ({ render: () => '<p>W tympanonie Chrystus.</p>' }));
const artwork = testArtwork(1, 'Portal królewski');

describe('NoteGapCard', () => {
	it('shows the note and turns to the artwork and back', async () => {
		render(NoteGapCard, { artwork, answered: false, note });
		const flip = page.getByRole('button', { name: m.review.quiz.showArtwork });

		await expect.element(page.getByText('W tympanonie Chrystus.')).toBeVisible();
		await flip.click();
		await expect.element(flip).toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText('W tympanonie Chrystus.')).not.toBeInTheDocument();
		await flip.click();

		await expect.element(page.getByText('W tympanonie Chrystus.')).toBeVisible();
	});

	it('returns to the note once the question is answered', async () => {
		const props = $state({ artwork, answered: false, note });
		render(NoteGapCard, props);

		await page.getByRole('button', { name: m.review.quiz.showArtwork }).click();
		await expect.element(page.getByText('W tympanonie Chrystus.')).not.toBeInTheDocument();
		props.answered = true;

		await expect.element(page.getByText('W tympanonie Chrystus.')).toBeVisible();
	});
});
