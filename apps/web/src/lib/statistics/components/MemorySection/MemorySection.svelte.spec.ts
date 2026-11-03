import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import { testStatistics } from '#lib/testing/statistics/statistics.ts';
import MemorySection from './MemorySection.svelte';

const texts = m.statistics.memory;
const now = new Date('2026-11-03T12:00:00Z');
const artworks = [testArtwork(1, 'Ofelia'), testArtwork(2, 'Madonna')];

describe('MemorySection', () => {
	it('shows the groups, the quiz share and the lists', async () => {
		render(MemorySection, {
			artworks,
			now,
			cards: new Map([
				['artwork-1', testReviewCard('artwork-1', new Date('2026-11-05T12:00:00Z'), { lapses: 2 })]
			]),
			statistics: testStatistics({
				quizAnswers: 106,
				correctAnswers: 83,
				mostReviewed: [{ artworkId: 'artwork-2', times: 12 }]
			})
		});

		await expect.element(page.getByText('78%')).toBeVisible();
		await expect.element(page.getByText(texts.quizShare(83, 106))).toBeVisible();
		await expect.element(page.getByRole('heading', { name: texts.mostReviewed })).toBeVisible();
		await expect.element(page.getByText(texts.times(12))).toBeVisible();
		await expect.element(page.getByText(texts.times(2), { exact: true })).toBeVisible();
		await expect.element(page.getByText(texts.stableIn(2))).toBeInTheDocument();
	});

	it('says when the quiz share and the statistics will appear', async () => {
		render(MemorySection, {
			artworks,
			now,
			cards: new Map([['artwork-1', testReviewCard('artwork-1', now)]]),
			statistics: testStatistics({ quizAnswers: 5 })
		});
		await expect.element(page.getByText(texts.quizLater(5))).toBeVisible();
	});

	it('waits for the first review', async () => {
		render(MemorySection, { artworks, now, cards: new Map(), statistics: testStatistics() });

		await expect.element(page.getByText(texts.noCards)).toBeVisible();
	});
});
