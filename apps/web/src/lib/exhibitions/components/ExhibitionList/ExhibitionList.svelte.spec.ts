import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import ExhibitionList from './ExhibitionList.svelte';

function summary(id: string, title: string, coverId: string | null = null): ExhibitionSummary {
	return { id, title, updatedAt: '2020-03-04T10:00:00Z', artworkCount: 1, coverId };
}

describe('ExhibitionList', () => {
	it('lists the exhibitions in the order given, each with its cover', async () => {
		const cover = testArtwork(1, 'Judith');
		render(ExhibitionList, {
			exhibitions: [summary('b', 'Light', cover.id), summary('a', 'Shadow')],
			covers: new Map([[cover.id, cover]])
		});

		const titles = page.getByRole('listitem').elements();
		expect(titles.map((item) => item.textContent?.includes('Light'))).toEqual([true, false]);
		expect(document.querySelectorAll('img')).toHaveLength(1);
		await expect.element(page.getByRole('link', { name: /Shadow/ })).toBeInTheDocument();
	});
});
