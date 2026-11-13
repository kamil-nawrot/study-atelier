import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { testGeography } from '#lib/testing/map/map.ts';
import type { PlacePoint as Point } from '#lib/map/types/place-point.ts';
import PlaceField from './PlaceField.svelte';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));
vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));

const rome = {
	wikidataId: 'Q220',
	label: 'Rzym',
	description: 'stolica Włoch',
	latitude: 41.89306,
	longitude: 12.48278
};

describe('PlaceField', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
		vi.mocked(searchWikidataPlaces).mockResolvedValue([rome]);
	});

	it('searches by the name of the place and takes the chosen suggestion', async () => {
		const value = $state<{ point: Point | null; wikidataId: string | null }>({
			point: null,
			wikidataId: null
		});
		render(PlaceField, {
			name: 'Rzym',
			get point() {
				return value.point;
			},
			set point(next) {
				value.point = next;
			},
			get wikidataId() {
				return value.wikidataId;
			},
			set wikidataId(next) {
				value.wikidataId = next;
			}
		});

		await page.getByRole('button', { name: /stolica Włoch/ }).click();

		expect(searchWikidataPlaces).toHaveBeenCalledWith('Rzym');
		expect(value.point).toEqual({ latitude: 41.89306, longitude: 12.48278 });
		expect(value.wikidataId).toBe('Q220');
	});

	it('removes the position', async () => {
		const value = $state<{ point: Point | null }>({
			point: { latitude: 48.86111, longitude: 2.33583 }
		});
		render(PlaceField, {
			name: 'Luwr',
			get point() {
				return value.point;
			},
			set point(next) {
				value.point = next;
			}
		});

		await page.getByRole('button', { name: m.map.position.remove }).click();

		expect(value.point).toBeNull();
	});
});
