import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
import { PLACE_FOLDING_KEYS } from '#lib/card-index/place-tree/place-tree.ts';
import CardIndexPlaceGroups from './CardIndexPlaceGroups.svelte';

const groups = [
	{
		id: 'paris',
		name: 'Paryż',
		count: 3,
		city: true,
		places: [{ id: 'louvre', name: 'Luwr', count: 2, placeType: 'museum' as const }]
	},
	{
		id: 'lascaux',
		name: 'Lascaux',
		count: 1,
		city: false,
		placeType: 'on_site' as const,
		places: []
	}
];

describe('CardIndexPlaceGroups', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('folds the places of a city and remembers its unfolding', async () => {
		const folding = new TimelineFolding(
			() => ({ query: '', matched: [], periods: ['paris'] }),
			PLACE_FOLDING_KEYS
		);
		render(CardIndexPlaceGroups, { props: { groups, folding } });

		await expect.element(page.getByText('Luwr')).not.toBeInTheDocument();
		await expect.element(page.getByText('Lascaux')).toBeVisible();

		await page.getByRole('button', { name: 'Paryż' }).click();

		await expect.element(page.getByText('Luwr')).toBeVisible();
		expect(localStorage.getItem(PLACE_FOLDING_KEYS.open)).toBe('["paris"]');
	});
});
