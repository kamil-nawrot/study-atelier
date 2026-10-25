import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import PinCard from './PinCard.svelte';

const PIN = {
	id: 'pin-1',
	imageId: 'image-1',
	x: 0.5,
	y: 0.5,
	glossaryEntryId: null,
	text: 'The rose window.'
};

describe('PinCard', () => {
	it('shows the term and the text of the pin', async () => {
		render(PinCard, {
			pin: { ...PIN, glossaryEntryId: 'entry-1' },
			entry: testEntry('entry-1', 'Rose window')
		});

		await expect.element(page.getByText('The rose window.')).toBeVisible();
		await expect.element(page.getByText('Rose window', { exact: true })).toBeVisible();
	});

	it('shows only the text of a pin without a term', async () => {
		render(PinCard, { pin: PIN });

		await expect.element(page.getByText('The rose window.')).toBeVisible();
	});

	it('shows the view of the loupe above the text of a pin that keeps one', async () => {
		const { container } = await render(PinCard, {
			pin: { ...PIN, viewWidth: 0.1 },
			image: {
				kind: 'url',
				url: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"/>')}`,
				width: 4000,
				height: 3000
			},
			shownWidth: 550
		});

		await expect.element(page.getByText('4×')).toBeVisible();
		expect(container.querySelector('.lens')).not.toBeNull();
		await expect.element(page.getByText('The rose window.')).toBeVisible();
	});
});
