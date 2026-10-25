import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import VisitBackdrop from './VisitBackdrop.svelte';

describe('VisitBackdrop', () => {
	it('shows the image for the eye only', () => {
		render(VisitBackdrop, { artwork: testArtwork(1, 'Water Lilies') });

		const backdrop = document.querySelector('[aria-hidden="true"]');
		expect(backdrop?.querySelector('img')?.getAttribute('alt')).toBe('');
	});

	it('shows nothing for an image that could not be fetched', () => {
		render(VisitBackdrop, { artwork: testArtwork(2, 'Lost', { imageUnavailable: true }) });

		expect(document.querySelector('[aria-hidden="true"] img')).toBeNull();
	});

	it('shows nothing while only the size of the image is known', () => {
		render(VisitBackdrop, {
			artwork: testArtwork(4, 'Pending', { image: { width: 40, height: 30 } })
		});

		expect(document.querySelector('[aria-hidden="true"] img')).toBeNull();
	});

	it('asks for the image once it comes near the screen', async () => {
		const pending = testArtwork(3, 'Pending', {
			image: undefined,
			pendingImage: { sourceFile: 'Pending.jpg' }
		});
		const onnearscreen = vi.fn();
		render(VisitBackdrop, { artwork: pending, onnearscreen });

		await vi.waitFor(() => expect(onnearscreen).toHaveBeenCalledWith(pending));
	});
});
