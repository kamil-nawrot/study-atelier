import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import OrderTile from './OrderTile.svelte';

const artwork = testArtwork(3, 'Mona Lisa', { yearFrom: 1503, yearTo: 1519 });

describe('OrderTile', () => {
	it('shows its place without naming the artwork before the answer', async () => {
		render(OrderTile, { artwork, index: 1 });

		await expect.element(page.getByText('2')).toBeInTheDocument();
		await expect.element(page.getByText('1503–1519')).not.toBeInTheDocument();
	});

	it('shows the real years after the answer and where a wrong one should be', async () => {
		render(OrderTile, { artwork, index: 0, place: { artwork, right: false, place: 3 } });

		await expect.element(page.getByText('1503–1519')).toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.shouldBe(4))).toBeInTheDocument();
	});

	it('says nothing about the place of an artwork put right', async () => {
		render(OrderTile, { artwork, index: 2, place: { artwork, right: true, place: 2 } });

		await expect.element(page.getByText('1503–1519')).toBeInTheDocument();
		await expect.element(page.getByText(m.review.order.shouldBe(3))).not.toBeInTheDocument();
	});
});
