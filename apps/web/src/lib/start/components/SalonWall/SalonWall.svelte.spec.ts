import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { salonArtworks } from '#lib/start/salon/salon.ts';
import SalonWall from './SalonWall.svelte';

describe('SalonWall', () => {
	it('hangs every artwork in a frame, hidden from screen readers as decoration', async () => {
		const artworks = salonArtworks(() => 0.5);
		render(SalonWall, { artworks });

		const wall = page.getByRole('list', { includeHidden: true });
		await expect.element(wall).toHaveAttribute('aria-hidden', 'true');
		expect(document.querySelectorAll('.place img')).toHaveLength(artworks.length);
		expect(document.querySelector('.place img')?.getAttribute('src')).toContain(
			encodeURIComponent(artworks[0].file)
		);
	});
});
