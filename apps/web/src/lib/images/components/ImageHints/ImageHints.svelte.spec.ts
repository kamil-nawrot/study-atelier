import Pin from '@lucide/svelte/icons/pin';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ImageHints from './ImageHints.svelte';

describe('ImageHints', () => {
	it('lists the hints of the image', async () => {
		render(ImageHints, { hints: [{ icon: Pin, text: 'Wskaż miejsce na obrazie.' }] });

		await expect.element(page.getByText('Wskaż miejsce na obrazie.')).toBeVisible();
		expect(page.getByRole('listitem').elements().length).toBeGreaterThanOrEqual(1);
	});
});
