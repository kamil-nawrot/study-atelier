import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import BackLink from './BackLink.svelte';

describe('BackLink', () => {
	it('names the place it leads to on a larger screen', async () => {
		await page.viewport(1280, 800);
		render(BackLink, { fallbackName: 'Atelier', fallbackHref: '/atelier' });

		await expect
			.element(page.getByRole('link', { name: 'Atelier' }))
			.toHaveAttribute('href', '/atelier');
		await expect.element(page.getByText('Atelier')).not.toHaveClass('visually-hidden');
	});

	it('shows only the arrow on a phone and keeps the name for assistive technology', async () => {
		await page.viewport(390, 844);
		render(BackLink, { fallbackName: 'Atelier', fallbackHref: '/atelier' });

		await expect.element(page.getByRole('link', { name: 'Atelier' })).toBeVisible();
		await expect.element(page.getByText('Atelier')).toHaveClass('visually-hidden');
	});
});
