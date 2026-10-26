import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import ChroniclePage from './+page.svelte';
import type { Visit } from '#lib/chronicle/types/visit.ts';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/chronicle'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const lilies = testArtwork(1, 'Water Lilies');

function renderChronicle(visits: Visit[], error?: string): void {
	render(ChroniclePage, {
		data: { session: testSession(), visits, artworks: [lilies], error },
		params: {}
	});
}

describe('chronicle page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		await page.viewport(1280, 800);
	});

	it('counts the visits and the artworks seen and offers to add a visit', async () => {
		renderChronicle([
			testVisit({ id: 'a', artworkIds: [lilies.id] }),
			testVisit({ id: 'b', artworkIds: [lilies.id] })
		]);

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.chronicle.title);
		await expect.element(page.getByText(m.chronicle.count(2, 1))).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: m.chronicle.add }))
			.toHaveAttribute('href', '/atelier/chronicle/new');
	});

	it('shows the empty chronicle without a count', async () => {
		renderChronicle([]);

		await expect.element(page.getByText(m.chronicle.empty)).toBeInTheDocument();
		await expect.element(page.getByText(m.chronicle.count(0, 0))).not.toBeInTheDocument();
	});

	it('says when the chronicle could not be loaded', async () => {
		renderChronicle([], m.common.network);

		await expect.element(page.getByText(m.chronicle.loadErrorTitle)).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: m.chronicle.add })).not.toBeInTheDocument();
	});

	it('confirms a change made elsewhere and clears it from the history entry', async () => {
		navigation.state = { chronicleMessage: m.chronicle.view.deleted('12 października') };
		renderChronicle([]);

		await expect
			.element(page.getByText(m.chronicle.view.deleted('12 października')))
			.toBeInTheDocument();
		expect(goto).toHaveBeenCalledWith('/atelier/chronicle', {
			state: {},
			shallow: true,
			replace: true
		});
	});
});
