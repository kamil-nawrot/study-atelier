import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testStatistics } from '#lib/testing/statistics/statistics.ts';
import OdditiesSection from './OdditiesSection.svelte';

const texts = m.statistics.oddities;

describe('OdditiesSection', () => {
	it('shows the oddities with links to the artwork, the wall and the visit', async () => {
		render(OdditiesSection, {
			artworks: [
				testArtwork(1, 'Venus', { yearTo: -25000, authors: ['Unknown'] }),
				testArtwork(2, 'Cathedral', { yearFrom: 1248, yearTo: 1880, authors: ['Gerhard'] })
			],
			statistics: testStatistics({
				authorsWithYears: 2,
				longestLived: {
					valueId: 'titian',
					name: 'Tycjan',
					birthYear: 1488,
					deathYear: 1576,
					yearsApproximate: true,
					tied: 0
				},
				mostPinned: { artworkId: 'artwork-2', pins: 2, tied: 1 },
				largestVisit: {
					visitId: 'visit-1',
					place: 'Uffizi, Florencja',
					visitedOn: '2025-05-01',
					datePrecision: 'day',
					artworks: 3,
					tied: 0
				}
			})
		});

		await expect.element(page.getByText(texts.oldest)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Venus' }))
			.toHaveAttribute('href', '/atelier/1');
		await expect.element(page.getByText(`1248–1880, ${texts.years(632)}`)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Tycjan' }))
			.toHaveAttribute('href', '/atelier?author=Tycjan');
		await expect.element(page.getByText(`ok. 1488–1576, ${texts.years(88)}`)).toBeVisible();
		await expect
			.element(page.getByText(`${texts.pinCount(2)}, ${texts.tiedArtworks(1)}`))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Uffizi, Florencja' }))
			.toHaveAttribute('href', '/atelier/chronicle/visit-1');
		await expect.element(page.getByText(texts.datesLater)).not.toBeInTheDocument();
	});

	it('says when the oddities will appear', async () => {
		render(OdditiesSection, {
			artworks: [testArtwork(1, 'Alone', { yearTo: null })],
			statistics: testStatistics()
		});

		await expect.element(page.getByText(texts.noneYet)).toBeVisible();
	});
});
