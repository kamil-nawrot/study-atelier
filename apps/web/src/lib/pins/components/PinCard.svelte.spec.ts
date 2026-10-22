import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testEntry } from '#lib/testing/glossary.ts';
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
			open: true,
			pin: { ...PIN, glossaryEntryId: 'entry-1' },
			number: 3,
			entry: testEntry('entry-1', 'Rose window')
		});

		const card = page.getByRole('alertdialog');
		await expect.element(card).toHaveTextContent('Pinezka 3');
		await expect.element(card).toHaveTextContent('The rose window.');
		await expect.element(card).toHaveTextContent('Rose window');
	});

	it('shows only the text of a pin without a term', async () => {
		render(PinCard, { open: true, pin: PIN, number: 1 });

		await expect.element(page.getByRole('alertdialog')).toHaveTextContent('The rose window.');
	});
});
