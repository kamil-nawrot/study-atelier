import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import ArtworkExhibitions from './ArtworkExhibitions.svelte';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

function summary(
	id: string,
	title: string,
	count: number,
	coverId: string | null
): ExhibitionSummary {
	return {
		id,
		title,
		updatedAt: '2026-11-01T10:00:00Z',
		artworkCount: count,
		coverId
	};
}

describe('ArtworkExhibitions', () => {
	it('shows nothing when no exhibition holds the artwork', async () => {
		render(ArtworkExhibitions, { exhibitions: [], covers: [] });

		expect(document.querySelector('.exhibitions')).toBeNull();
	});

	it('counts the exhibitions in Polish and lists them with a link', async () => {
		render(ArtworkExhibitions, {
			exhibitions: [summary('e1', 'Light', 1, 'artwork-1'), summary('e2', 'Dark', 5, null)],
			covers: [testArtwork(1, 'Judith')]
		});

		await userEvent.click(page.getByText(m.exhibitions.onExhibitions(2)));

		expect(m.exhibitions.onExhibitions(1)).toBe('Na 1 wystawie');
		expect(m.exhibitions.onExhibitions(2)).toBe('Na 2 wystawach');
		expect(m.exhibitions.onExhibitions(5)).toBe('Na 5 wystawach');
		await expect
			.element(page.getByRole('link', { name: /Light/ }))
			.toHaveAttribute('href', '/atelier/exhibitions/e1');
		await expect.element(page.getByText(m.exhibitions.artworkCount(5))).toBeVisible();
		expect(document.querySelectorAll('img')).toHaveLength(1);
	});
});
