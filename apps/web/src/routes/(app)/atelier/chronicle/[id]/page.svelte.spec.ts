import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { deleteVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testVisit, VISIT_ID } from '#lib/testing/chronicle/chronicle.ts';
import VisitPage from './+page.svelte';
import type { Visit } from '#lib/chronicle/types/visit.ts';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/chronicle/visit'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({
	page: navigation,
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ deleteVisit: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const lilies = testArtwork(1, 'Water Lilies');

function renderVisit(
	visit: Visit | undefined,
	rest: { notFound?: boolean; error?: string; artworksError?: string } = {}
): void {
	render(VisitPage, {
		data: { session: testSession(), visit, artworks: [lilies], ...rest },
		params: { id: visit?.id ?? 'unknown' }
	});
}

describe('visit page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		await page.viewport(1280, 800);
	});

	it('shows the visit with the artworks seen and links to its form', async () => {
		renderVisit(testVisit({ artworkIds: [lilies.id] }));

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Musée d’Orsay');
		await expect
			.element(page.getByRole('link', { name: m.common.edit }))
			.toHaveAttribute('href', `/atelier/chronicle/${VISIT_ID}/edit`);
		await expect.element(page.getByRole('link', { name: /Water Lilies/ })).toBeInTheDocument();
	});

	it('deletes the visit after asking and returns to the chronicle with a confirmation', async () => {
		vi.mocked(deleteVisit).mockResolvedValue({});
		renderVisit(testVisit({ date: { on: '2024-10-12', precision: 'day' } }));

		await userEvent.click(page.getByRole('button', { name: m.common.delete }));
		await userEvent.click(
			page.getByRole('alertdialog').getByRole('button', { name: m.common.delete, exact: true })
		);

		await vi.waitFor(() => expect(goto).toHaveBeenCalled());
		expect(goto).toHaveBeenCalledWith('/atelier/chronicle', {
			refreshAll: true,
			state: { chronicleMessage: m.chronicle.view.deleted('12 października 2024') }
		});
	});

	it('shows a confirmation from the form', async () => {
		navigation.state = { chronicleMessage: 'Zapisano.' };
		renderVisit(testVisit());

		await expect.element(page.getByText('Zapisano.')).toBeInTheDocument();
	});

	it('says when the artworks could not be loaded', async () => {
		renderVisit(testVisit(), { artworksError: m.common.network });

		await expect.element(page.getByText(m.common.network)).toBeInTheDocument();
	});

	it('says that the visit does not exist', async () => {
		renderVisit(undefined, { notFound: true });

		await expect.element(page.getByText(m.chronicle.errors.notFound)).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.common.delete }))
			.not.toBeInTheDocument();
	});
});
