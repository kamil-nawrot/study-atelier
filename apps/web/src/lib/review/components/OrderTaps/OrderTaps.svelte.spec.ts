import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import OrderTaps from './OrderTaps.svelte';

const older = testArtwork(1, 'Older', { yearTo: 1400 });
const newer = testArtwork(2, 'Newer', { yearTo: 1800 });

describe('OrderTaps', () => {
	it('numbers the tapped artworks and reports the order once all are tapped', async () => {
		const onchange = vi.fn();
		render(OrderTaps, { artworks: [newer, older], onchange });
		const unpicked = page.getByRole('button', { name: m.review.order.imageAlt });

		await unpicked.nth(1).click();
		expect(onchange).toHaveBeenLastCalledWith(undefined);
		await expect
			.element(page.getByRole('button', { name: m.review.order.place(1, 2) }))
			.toHaveAttribute('aria-pressed', 'true');
		await unpicked.first().click();

		expect(onchange).toHaveBeenLastCalledWith([older, newer]);
	});

	it('shows the answer on disabled tiles', async () => {
		render(OrderTaps, { artworks: [newer, older], answered: true, onchange: vi.fn() });

		await expect.element(page.getByText(m.review.order.shouldBe(2))).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.review.order.place(1, 2) }))
			.toBeDisabled();
	});
});
