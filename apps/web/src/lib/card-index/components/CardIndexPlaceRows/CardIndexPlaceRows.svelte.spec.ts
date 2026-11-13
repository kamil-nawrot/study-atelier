import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexPlaceRows from './CardIndexPlaceRows.svelte';

describe('CardIndexPlaceRows', () => {
	it('links every place to its page with its type and number of artworks', async () => {
		render(CardIndexPlaceRows, {
			props: { places: [{ id: 'louvre', name: 'Luwr', count: 2, placeType: 'museum' }] }
		});

		const link = page.getByRole('link', {
			name: m.cardIndex.openValue('Luwr', m.atelier.count(2))
		});
		await expect.element(link).toHaveAttribute('href', '/atelier/values/location/louvre');
		await expect.element(page.getByTitle(m.valueForm.placeTypes.museum)).toBeInTheDocument();
	});
});
