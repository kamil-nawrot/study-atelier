import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
import { PLACE_FOLDING_KEYS } from '#lib/card-index/place-tree/place-tree.ts';
import CardIndexCountry from './CardIndexCountry.svelte';

describe('CardIndexCountry', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('shows a country with its count and folds its cities', async () => {
		const folding = new TimelineFolding(
			() => ({ query: '', matched: [], periods: [] }),
			PLACE_FOLDING_KEYS
		);
		render(CardIndexCountry, {
			props: {
				folding,
				country: {
					code: 'IT',
					name: 'Włochy',
					count: 9,
					groups: [{ id: 'rome', name: 'Rzym', count: 9, city: true, places: [] }]
				}
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Włochy' })).toBeVisible();
		await expect.element(page.getByText(m.atelier.count(9)).first()).toBeVisible();
		await expect.element(page.getByText('Rzym')).toBeVisible();

		await page.getByRole('button', { name: 'Włochy' }).click();

		await expect.element(page.getByText('Rzym')).not.toBeInTheDocument();
		expect(localStorage.getItem(PLACE_FOLDING_KEYS.folded)).toBe('["IT"]');
	});
});
