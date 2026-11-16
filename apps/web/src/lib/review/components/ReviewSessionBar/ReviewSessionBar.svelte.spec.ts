import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import ReviewSessionBar from './ReviewSessionBar.svelte';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

function sessionOf(length: number, position: number, free = false): ReviewSession {
	const queue: SessionStep[] = Array.from({ length }, (_, index) => ({
		artwork: testArtwork(index + 1, `Artwork ${index + 1}`),
		card: null,
		mode: 'flashcard'
	}));
	const session = new ReviewSession(queue, new Map(), undefined, undefined, free);
	session.position = position;
	return session;
}

describe('ReviewSessionBar', () => {
	it('shows the number of the current question out of all of them', async () => {
		render(ReviewSessionBar, { session: sessionOf(8, 2), onstop: vi.fn() });

		await expect.element(page.getByText(m.review.progress(3, 8))).toBeVisible();
		const progress = page.getByRole('progressbar', { name: m.review.progressLabel });
		await expect.element(progress).toHaveAttribute('aria-valuenow', '2');
		await expect.element(progress).toHaveAttribute('aria-valuemax', '8');
		expect(document.querySelector<HTMLElement>('.fill')?.style.width).toBe('25%');
	});

	it('never counts past the last question', async () => {
		render(ReviewSessionBar, { session: sessionOf(4, 4), onstop: vi.fn() });

		await expect.element(page.getByText(m.review.progress(4, 4))).toBeVisible();
		expect(document.querySelector<HTMLElement>('.fill')?.style.width).toBe('100%');
	});

	it('shows an empty bar for an empty queue', async () => {
		render(ReviewSessionBar, { session: sessionOf(0, 0), onstop: vi.fn() });

		expect(document.querySelector<HTMLElement>('.fill')?.style.width).toBe('0%');
	});

	it('tags a free round', async () => {
		render(ReviewSessionBar, { session: sessionOf(3, 0, true), onstop: vi.fn() });

		await expect.element(page.getByText(m.review.freeTag)).toBeVisible();
	});

	it('does not tag a regular round', async () => {
		render(ReviewSessionBar, { session: sessionOf(3, 0), onstop: vi.fn() });

		await expect.element(page.getByText(m.review.freeTag)).not.toBeInTheDocument();
	});

	it('stops the round with the stop button', async () => {
		const onstop = vi.fn();
		render(ReviewSessionBar, { session: sessionOf(3, 1), onstop });

		await page.getByRole('button', { name: m.review.stop }).click();

		expect(onstop).toHaveBeenCalledOnce();
	});
});
