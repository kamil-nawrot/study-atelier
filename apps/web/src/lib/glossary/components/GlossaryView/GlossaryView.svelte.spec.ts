import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import GlossaryView from './GlossaryView.svelte';

const figure = {
	birthYear: 1511,
	deathYear: 1574,
	yearsApproximate: false,
	country: 'Włochy',
	image: { kind: 'url' as const, url: 'https://example.test/vasari.jpg', width: 3, height: 4 }
};

describe('GlossaryView', () => {
	it('shows the portrait, the life years and the country of a figure', async () => {
		render(GlossaryView, {
			entry: testEntry('a-vasari', 'Giorgio Vasari', { category: 'artist', figure })
		});

		await expect.element(page.getByRole('img', { name: 'Giorgio Vasari' })).toBeVisible();
		await expect.element(page.getByText('Włochy')).toBeVisible();
		await expect.element(page.getByText(/1511/)).toBeVisible();
	});

	it('shows no portrait or life line for a term', async () => {
		render(GlossaryView, { entry: testEntry('a-apse', 'Apsyda') });

		await expect.element(page.getByRole('heading', { name: 'Apsyda' })).toBeVisible();
		expect(page.getByRole('img').elements()).toHaveLength(0);
	});
});
