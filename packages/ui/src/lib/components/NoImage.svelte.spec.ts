import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../messages';
import NoImage from './NoImage.svelte';

describe('NoImage', () => {
	it('is an image named with the default label', async () => {
		await render(NoImage);

		await expect.element(page.getByRole('img', { name: defaultUiMessages.noImage })).toBeVisible();
	});

	it('uses the label it is given', async () => {
		await render(NoImage, { label: 'Artwork without a photo' });

		await expect.element(page.getByRole('img', { name: 'Artwork without a photo' })).toBeVisible();
	});

	it('keeps the 4:5 ratio of the window', async () => {
		await render(NoImage, { label: 'Artwork without a photo' });

		const box = page
			.getByRole('img', { name: 'Artwork without a photo' })
			.element()
			.getBoundingClientRect();

		expect(box.height / box.width).toBeCloseTo(1.25, 1);
	});

	it('draws both diagonals of the frame', async () => {
		const { container } = await render(NoImage);

		expect(container.querySelectorAll('svg line')).toHaveLength(2);
	});
});
