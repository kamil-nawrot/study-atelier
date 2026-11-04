import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import OrderAxis from './OrderAxis.svelte';

describe('OrderAxis', () => {
	it('numbers the artworks from the oldest between the first and the last year', async () => {
		render(OrderAxis, {
			artworks: [
				testArtwork(1, 'C', { yearTo: 1642 }),
				testArtwork(2, 'A', { yearTo: -1345 }),
				testArtwork(3, 'D', { yearTo: 1889 }),
				testArtwork(4, 'B', { yearTo: 1434 })
			]
		});

		for (const number of ['1', '2', '3', '4']) {
			await expect.element(page.getByText(number, { exact: true })).toBeInTheDocument();
		}
		await expect.element(page.getByText('1345 p.n.e.')).toBeInTheDocument();
		await expect.element(page.getByText('1889')).toBeInTheDocument();
	});
});
