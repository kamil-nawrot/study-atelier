import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import PlaceSuggestions from './PlaceSuggestions.svelte';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));

const louvre = {
	wikidataId: 'Q19675',
	label: 'Luwr',
	description: 'muzeum sztuki w Paryżu',
	latitude: 48.86111,
	longitude: 2.33583
};

describe('PlaceSuggestions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('offers the places found for the name and gives the chosen one', async () => {
		vi.mocked(searchWikidataPlaces).mockResolvedValue([louvre]);
		const onchoose = vi.fn();
		render(PlaceSuggestions, { name: 'Luwr, Paryż', choice: null, onchoose });

		await expect.element(page.getByText(m.map.suggestions.title)).toBeVisible();
		await page.getByRole('button', { name: /Luwr/ }).click();

		expect(searchWikidataPlaces).toHaveBeenCalledWith('Luwr, Paryż');
		expect(onchoose).toHaveBeenCalledWith({
			point: { latitude: 48.86111, longitude: 2.33583 },
			wikidataId: 'Q19675'
		});
	});

	it('marks the chosen place', async () => {
		vi.mocked(searchWikidataPlaces).mockResolvedValue([louvre]);
		render(PlaceSuggestions, {
			name: 'Luwr',
			choice: { point: { latitude: 0, longitude: 0 }, wikidataId: 'Q19675' },
			onchoose: vi.fn()
		});

		await expect
			.element(page.getByRole('button', { name: /Luwr/ }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('asks for a click on the map when nothing fits', async () => {
		vi.mocked(searchWikidataPlaces).mockResolvedValue([]);
		render(PlaceSuggestions, { name: 'Nowhere', choice: null, onchoose: vi.fn() });

		await expect.element(page.getByText(m.map.suggestions.none)).toBeVisible();
	});

	it('says the suggestions could not be fetched', async () => {
		vi.mocked(searchWikidataPlaces).mockRejectedValue(new Error('offline'));
		render(PlaceSuggestions, { name: 'Luwr', choice: null, onchoose: vi.fn() });

		await expect.element(page.getByText(m.map.suggestions.failed)).toBeVisible();
	});
});
