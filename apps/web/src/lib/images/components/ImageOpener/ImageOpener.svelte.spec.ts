import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ImageOpener from './ImageOpener.svelte';

describe('ImageOpener', () => {
	it('opens the image full screen', async () => {
		render(ImageOpener, {
			alt: 'Judith',
			image: { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', width: 1, height: 1 }
		});

		await page.getByRole('button', { name: m.artworkView.openImage }).click();

		await expect.element(page.getByRole('dialog', { name: 'Judith' })).toBeVisible();
	});
});
