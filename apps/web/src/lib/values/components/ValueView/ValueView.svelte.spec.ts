import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { testGeography } from '#lib/testing/map/map.ts';
import { m } from '#lib/i18n/i18n.ts';
import ValueView from './ValueView.svelte';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));

const city = {
	kind: 'location',
	record: { id: 'paris', category: 'location', name: 'Paris', count: 2, placeType: 'city' }
} as const;

describe('ValueView', () => {
	beforeEach(() => {
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
	});

	it('lists the places of a city under the notes', async () => {
		render(ValueView, {
			props: {
				subject: city,
				parents: [],
				count: 2,
				details: { summary: '', notes: '', location: { countryCode: 'FR', placeType: 'city' } },
				cityPlaces: [{ id: 'louvre', name: 'Louvre', count: 1, placeType: 'museum' }]
			}
		});

		await expect
			.element(page.getByRole('heading', { name: m.valuePage.city.places }))
			.toBeVisible();
		await expect.element(page.getByText('Louvre')).toBeVisible();
	});

	it('shows no list of places for a value without places', async () => {
		render(ValueView, {
			props: {
				subject: city,
				parents: [],
				count: 0,
				details: { summary: '', notes: '', location: { countryCode: 'FR', placeType: 'city' } }
			}
		});

		await expect
			.element(page.getByRole('heading', { name: m.valuePage.city.places }))
			.not.toBeInTheDocument();
	});
});
