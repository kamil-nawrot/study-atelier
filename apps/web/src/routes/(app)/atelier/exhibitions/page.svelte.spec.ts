import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { createExhibition } from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import ExhibitionsPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/exhibitions'),
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
vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	createExhibition: vi.fn()
}));

const cover = testArtwork(1, 'Judith');
const light = {
	id: '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
	title: 'Light',
	updatedAt: '2026-11-01T10:00:00Z',
	artworkCount: 1,
	coverId: cover.id
};

function renderList(exhibitions = [light], error?: string): void {
	render(ExhibitionsPage, {
		data: { session: testSession(), exhibitions, covers: [cover], error },
		params: {}
	});
}

describe('exhibitions page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		navigation.state = {};
		await page.viewport(1280, 800);
	});

	it('lists the exhibitions with their number', async () => {
		renderList();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.exhibitions.title);
		await expect.element(page.getByText(m.exhibitions.count(1))).toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: /Light/ }))
			.toHaveAttribute('href', `/atelier/exhibitions/${light.id}`);
	});

	it('invites to the first exhibition when there is none', async () => {
		renderList([]);

		await expect.element(page.getByText(m.exhibitions.emptyTitle)).toBeInTheDocument();
	});

	it('creates an exhibition and opens it for editing', async () => {
		vi.mocked(createExhibition).mockResolvedValue({ id: 'new-id' });
		renderList();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.add }));

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/atelier/exhibitions/new-id?edit'));
	});

	it('says why an exhibition could not be added and stays on the list', async () => {
		vi.mocked(createExhibition).mockResolvedValue({ error: m.limits.exhibitions(200) });
		renderList();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.add }));

		await expect.element(page.getByText(m.limits.exhibitions(200))).toBeInTheDocument();
		expect(goto).not.toHaveBeenCalled();
	});

	it('shows the load error instead of the list', async () => {
		renderList([], 'Boom');

		await expect.element(page.getByText('Boom')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.add }))
			.not.toBeInTheDocument();
	});

	it('shows the message that came with the navigation and clears it from the history state', async () => {
		navigation.state = { exhibitionMessage: m.exhibitions.moved };
		renderList();

		await expect.element(page.getByText(m.exhibitions.moved)).toBeInTheDocument();
		expect(goto).toHaveBeenCalledWith('/atelier/exhibitions', {
			state: {},
			shallow: true,
			replace: true
		});
	});

	it('does not add a second exhibition while one is being added', async () => {
		vi.mocked(createExhibition).mockReturnValue(new Promise(() => {}));
		renderList();

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.add }));

		await expect.element(page.getByRole('button', { name: m.exhibitions.adding })).toBeDisabled();
		expect(createExhibition).toHaveBeenCalledTimes(1);
	});
});
