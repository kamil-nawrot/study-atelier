import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import MapPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/map'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));
vi.mock('#lib/map/geography/geography.ts', () => ({
	loadGeography: vi.fn(() => Promise.resolve(testGeography()))
}));

describe('map page', () => {
	beforeEach(async () => {
		await page.viewport(1280, 800);
	});

	it('shows the map of the places under its title and leads back to the wall', async () => {
		render(MapPage, {
			data: {
				session: testSession(),
				artworks: [testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true })],
				places: [testPlace('Louvre', { point: { latitude: 48.86111, longitude: 2.33583 } })]
			},
			params: {}
		});

		await expect
			.element(page.getByRole('banner').getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.map.title);
		await expect.element(page.getByText(m.map.lead)).toBeVisible();
		await expect.element(page.getByRole('button', { name: /^Paryż/ })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.map.back }).first())
			.toHaveAttribute('href', '/atelier');
	});

	it('says when the map could not be loaded', async () => {
		render(MapPage, {
			data: { session: testSession(), artworks: [], places: [], error: m.map.loadError },
			params: {}
		});

		await expect.element(page.getByText(m.map.loadError)).toBeVisible();
	});
});
