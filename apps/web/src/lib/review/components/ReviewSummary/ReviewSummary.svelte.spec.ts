import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { SummaryGroup } from '#lib/review/types/summary-group.ts';
import ReviewSummary from './ReviewSummary.svelte';

async function renderSummary(
	groups: SummaryGroup[],
	props: Partial<ComponentProps<typeof ReviewSummary>> = {}
): Promise<void> {
	await render(ReviewSummary, {
		count: 3,
		minutes: 1,
		tomorrow: 0,
		groups,
		nextRound: 0,
		onnext: vi.fn(),
		...props
	});
}

function group(name: string): HTMLDetailsElement {
	const details = page.getByRole('region', { name: new RegExp(name) }).element().firstElementChild;
	return details as HTMLDetailsElement;
}

describe('ReviewSummary', () => {
	it('opens the artworks to improve and collapses the others', async () => {
		await renderSummary([
			{ rating: 1, artworks: [testArtwork(1, 'Artwork 1')] },
			{ rating: 2, artworks: [testArtwork(2, 'Artwork 2')] },
			{ rating: 3, artworks: [testArtwork(3, 'Artwork 3'), testArtwork(4, 'Artwork 4')] }
		]);

		expect(group(m.review.groups[1]).open).toBe(true);
		expect(group(m.review.groups[2]).open).toBe(false);
		expect(group(m.review.groups[3]).open).toBe(false);
		await expect.element(page.getByRole('link', { name: /Artwork 1\b/ })).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Artwork 3\b/ })).not.toBeInTheDocument();
	});

	it('names the count of a group in its heading and opens the group on a click', async () => {
		await renderSummary([
			{ rating: 3, artworks: [testArtwork(3, 'Artwork 3'), testArtwork(4, 'Artwork 4')] }
		]);

		const heading = page.getByRole('heading', { name: `${m.review.groups[3]} 2` });
		await expect.element(heading).toBeVisible();
		expect(group(m.review.groups[3]).open).toBe(false);
		await heading.click();
		expect(group(m.review.groups[3]).open).toBe(true);
		await expect.element(page.getByRole('link', { name: /Artwork 3\b/ })).toBeVisible();
	});

	it('offers a free review after the last round of the day', async () => {
		const onfree = vi.fn();
		await renderSummary([{ rating: 3, artworks: [testArtwork(3, 'Artwork 3')] }], {
			freeOpen: true,
			onfree
		});

		await page.getByRole('button', { name: m.review.free }).click();
		expect(onfree).toHaveBeenCalled();
	});

	it('offers another free round after a free review and says the plan did not change', async () => {
		await renderSummary([{ rating: 3, artworks: [testArtwork(3, 'Artwork 3')] }], {
			free: true,
			freeOpen: true,
			nextRound: 4
		});

		await expect.element(page.getByText(m.review.freeSummary(3, 1))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.freeNextRound })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.nextRound(4) }))
			.not.toBeInTheDocument();
	});

	it('inflects the minutes and the artworks waiting tomorrow, and shares the sentence with a free review', () => {
		expect(m.review.summary(3, 1, 0)).toBe(
			'Dziś udało się powtórzyć 3 dzieła, zajęło Ci to 1 minutę.'
		);
		expect(m.review.summary(1, 3, 0)).toBe(
			'Dziś udało się powtórzyć 1 dzieło, zajęło Ci to 3 minuty.'
		);
		expect(m.review.summary(5, 5, 2)).toBe(
			'Dziś udało się powtórzyć 5 dzieł, zajęło Ci to 5 minut. Jutro będą na Ciebie czekać 2 dzieła.'
		);
		expect(m.review.summary(1, 1, 1)).toContain('Jutro będzie na Ciebie czekać 1 dzieło.');
		expect(m.review.freeSummary(5, 2)).toBe(
			'Dziś udało się powtórzyć 5 dzieł, zajęło Ci to 2 minuty. Plan powtórek się nie zmienił.'
		);
		expect(m.review.summary(1, 1, 12)).toContain('Jutro będzie na Ciebie czekać 12 dzieł.');
		expect(m.review.summary(1, 1, 23)).toContain('Jutro będą na Ciebie czekać 23 dzieła.');
		expect(m.review.summary(5, 22, 0)).toBe(
			'Dziś udało się powtórzyć 5 dzieł, zajęło Ci to 22 minuty.'
		);
	});
});
