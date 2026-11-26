import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AlbumPicture from './AlbumPicture.svelte';

describe('AlbumPicture', () => {
	it('shows an album image from the album folder at its stored size', async () => {
		render(AlbumPicture, {
			image: {
				path: 'sample-album/images/red-circle.webp',
				width: 600,
				height: 400,
				licence: 'CC0',
				licenceUrl: null,
				attribution: null
			}
		});

		const shown = (): HTMLImageElement | undefined =>
			[...document.querySelectorAll('img')].find((image) =>
				image.src.endsWith('/albums/sample-album/images/red-circle.webp')
			);
		await expect.poll(shown).toBeDefined();
		expect(shown()?.getAttribute('width')).toBe('600');
		expect(shown()?.getAttribute('alt')).toBe('');
	});
});
