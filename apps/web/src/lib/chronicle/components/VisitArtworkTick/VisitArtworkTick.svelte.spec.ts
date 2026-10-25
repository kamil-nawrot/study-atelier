import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import VisitArtworkTick from './VisitArtworkTick.svelte';

describe('VisitArtworkTick', () => {
	it('is a checkbox named by the title that toggles the artwork', async () => {
		const artwork = testArtwork(1, 'Water Lilies');
		const ontoggle = vi.fn();
		render(VisitArtworkTick, { artwork, checked: true, ontoggle });

		const box = page.getByRole('checkbox', { name: 'Water Lilies' });
		await expect.element(box).toBeChecked();
		await userEvent.click(page.getByText('Water Lilies'));

		expect(ontoggle).toHaveBeenCalledWith(artwork);
	});

	it('shows an unticked artwork without a tick', async () => {
		render(VisitArtworkTick, {
			artwork: testArtwork(2, 'Sketch', { hasImage: false, image: undefined }),
			checked: false,
			ontoggle: vi.fn()
		});

		await expect.element(page.getByRole('checkbox', { name: 'Sketch' })).not.toBeChecked();
	});
});
