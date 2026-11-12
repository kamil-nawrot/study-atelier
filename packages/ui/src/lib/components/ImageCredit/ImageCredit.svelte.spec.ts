import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import ImageCredit from './ImageCredit.svelte';

describe('ImageCredit', () => {
	it('names its button and keeps the credit hidden until asked', async () => {
		render(ImageCredit, { label: 'Image source', text: 'Wikimedia Commons, public domain' });

		await expect.element(page.getByRole('button', { name: 'Image source' })).toBeInTheDocument();
		await expect.element(page.getByText('Wikimedia Commons, public domain')).not.toBeVisible();
	});

	it('shows the credit on a click or a tap', async () => {
		render(ImageCredit, { label: 'Image source', text: 'Photo: Jane Doe, CC BY-SA 4.0' });

		await page.getByRole('button', { name: 'Image source' }).click();

		await expect
			.element(page.getByRole('tooltip'))
			.toHaveTextContent('Photo: Jane Doe, CC BY-SA 4.0');
	});
});
