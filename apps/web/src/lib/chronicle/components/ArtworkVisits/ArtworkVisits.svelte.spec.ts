import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import ArtworkVisits from './ArtworkVisits.svelte';

describe('ArtworkVisits', () => {
	it('lists the visits of an artwork under a heading with their number once opened', async () => {
		render(ArtworkVisits, {
			visits: [testVisit({ id: 'a' }), testVisit({ id: 'b', place: 'Luwr' })]
		});

		await expect
			.element(page.getByRole('heading', { name: m.chronicle.artworkVisits(2) }))
			.toBeInTheDocument();
		await expect.element(page.getByRole('link')).not.toBeInTheDocument();

		await page.getByText(m.chronicle.artworkVisits(2)).click();

		expect(page.getByRole('link').elements()).toHaveLength(2);
	});

	it('shows nothing for an artwork without visits', async () => {
		render(ArtworkVisits, { visits: [] });

		await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
	});
});
