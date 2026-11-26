import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import AlbumItemBar from './AlbumItemBar.svelte';

describe('AlbumItemBar', () => {
	it('shows the position of the open item', async () => {
		render(AlbumItemBar, { position: 2, total: 5 });

		await expect.element(page.getByText(m.albums.closing.progress(2, 5))).toBeVisible();
	});
});
