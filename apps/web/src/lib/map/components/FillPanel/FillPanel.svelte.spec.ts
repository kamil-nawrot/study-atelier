import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testPlace } from '#lib/testing/map/map.ts';
import FillPanel from './FillPanel.svelte';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn().mockResolvedValue([])
}));

function props(
	overrides: Partial<ComponentProps<typeof FillPanel>> = {}
): ComponentProps<typeof FillPanel> {
	return {
		current: { place: testPlace('Rzym'), count: 2 },
		left: 3,
		choice: null,
		saving: false,
		onchoose: vi.fn(),
		onsave: vi.fn(),
		onskip: vi.fn(),
		onclose: vi.fn(),
		...overrides
	};
}

describe('FillPanel', () => {
	it('asks where the place is and waits for a point before saving', async () => {
		render(FillPanel, props());

		await expect.element(page.getByRole('heading', { name: 'Rzym' })).toBeVisible();
		await expect.element(page.getByText(m.map.fill.lead('Rzym'))).toBeVisible();
		await expect
			.element(page.getByText(`${m.map.city.artworks(2)} · ${m.map.fill.left(3)}`))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: m.map.fill.save })).toBeDisabled();
	});

	it('saves a chosen point', async () => {
		const onsave = vi.fn();
		render(
			FillPanel,
			props({ onsave, choice: { point: { latitude: 41.9, longitude: 12.5 }, wikidataId: null } })
		);
		await page.getByRole('button', { name: m.map.fill.save }).click();
		expect(onsave).toHaveBeenCalled();
	});

	it('skips the place, shows a save error and closes', async () => {
		const onskip = vi.fn();
		const onclose = vi.fn();
		render(FillPanel, props({ onskip, onclose, error: m.map.saveFailed }));

		await expect.element(page.getByText(m.map.saveFailed)).toBeVisible();
		await page.getByRole('button', { name: m.map.fill.skip }).click();
		await page.getByRole('button', { name: m.map.fill.close }).click();
		expect(onskip).toHaveBeenCalled();
		expect(onclose).toHaveBeenCalled();
	});

	it('says when every place is on the map', async () => {
		render(FillPanel, props({ current: undefined, left: 0 }));

		await expect.element(page.getByText(m.map.fill.done)).toBeVisible();
	});
});
