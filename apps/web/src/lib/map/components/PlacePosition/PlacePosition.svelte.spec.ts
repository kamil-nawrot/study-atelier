import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { testGeography } from '#lib/testing/map/map.ts';
import PlacePosition from './PlacePosition.svelte';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));

describe('PlacePosition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
	});

	it('says a place has no position and loads no map', async () => {
		render(PlacePosition, { point: null });

		await expect.element(page.getByText(m.map.position.empty)).toBeVisible();
		expect(loadGeography).not.toHaveBeenCalled();
	});

	it('shows the map and the town of a point without any way to change it', async () => {
		render(PlacePosition, { point: { latitude: 48.86111, longitude: 2.33583 } });

		await expect.element(page.getByText('Paryż, Francja')).toBeVisible();
		expect(page.getByRole('button', { name: m.map.position.change }).query()).toBeNull();
		expect(page.getByRole('button', { name: m.map.position.remove }).query()).toBeNull();
	});

	it('says the map could not load', async () => {
		vi.mocked(loadGeography).mockRejectedValue(new Error('offline'));
		render(PlacePosition, { point: { latitude: 48.86111, longitude: 2.33583 } });

		await expect.element(page.getByText(m.map.loadError)).toBeVisible();
	});
});
