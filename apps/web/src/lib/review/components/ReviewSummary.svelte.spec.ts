import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/testing/artworks.ts';
import { m } from '#lib/i18n/index.ts';
import type { SummaryGroup } from '../overview.ts';
import ReviewSummary from './ReviewSummary.svelte';

async function renderSummary(groups: SummaryGroup[]): Promise<void> {
	await render(ReviewSummary, {
		count: 3,
		minutes: 1,
		tomorrow: 0,
		groups,
		nextRound: 0,
		onnext: vi.fn()
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
});
