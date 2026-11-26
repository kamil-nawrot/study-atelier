import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import AlbumsHint from './AlbumsHint.svelte';

describe('AlbumsHint', () => {
	it('points to the list of albums inside its sentence', async () => {
		render(AlbumsHint, { text: m.albums.smallWallHint });

		await expect
			.element(page.getByRole('link', { name: m.albums.smallWallHint.link }))
			.toHaveAttribute('href', '/atelier/albums');
		await expect
			.element(page.getByText('Szukasz kolejnych dzieł? Zajrzyj do Albumów.'))
			.toBeInTheDocument();
	});
});
