import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { pending, TEST_EMAIL, testSession } from '#lib/testing/auth.ts';
import AtelierPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const signOut = vi.mocked(supabase.auth.signOut);

const artworks = [
	testArtwork(3, 'Déjeuner sur l’herbe'),
	testArtwork(2, 'Starry Night', { authors: [], date: undefined }),
	testArtwork(1, 'Night Watch', { image: undefined })
];

function renderAtelier(list: WallArtwork[] = artworks, error?: string): void {
	render(AtelierPage, { data: { session: testSession(), artworks: list, error }, params: {} });
}

function searchField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('searchbox', { name: m.atelier.search });
}

describe('atelier page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
	});

	it('shows every artwork with the count', async () => {
		renderAtelier();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.atelier.title);
		await expect.element(page.getByText(m.atelier.count(3))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Déjeuner sur l’herbe/ }))
			.toHaveAttribute('href', '/atelier/3');
		await expect.element(page.getByText('Starry Night')).toBeVisible();
		await expect.element(page.getByText('Night Watch')).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.add }))
			.toHaveAttribute('href', '/atelier/new');
	});

	it('filters by title ignoring case and diacritics', async () => {
		renderAtelier();

		await searchField().fill('DEJEUNER');

		await expect.element(page.getByText('Déjeuner sur l’herbe')).toBeVisible();
		await expect.element(page.getByText('Starry Night')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.atelier.filteredCount(1, 3))).toBeVisible();
	});

	it('says when nothing matches and clears the search', async () => {
		renderAtelier();

		await searchField().fill('sunflowers');

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.atelier.noResultsTitle);
		await expect.element(page.getByText(m.atelier.noResults('sunflowers'))).toBeVisible();

		await page.getByRole('button', { name: m.atelier.clearSearch, exact: true }).first().click();

		await expect.element(searchField()).toHaveValue('');
		await expect.element(page.getByText('Starry Night')).toBeVisible();
	});

	it('invites the learner to add the first artwork in an empty atelier', async () => {
		renderAtelier([]);

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.atelier.emptyTitle);
		await expect
			.element(page.getByRole('link', { name: m.atelier.addFirst }))
			.toHaveAttribute('href', '/atelier/new');
		await expect.element(searchField()).toBeDisabled();
		await expect.element(page.getByText(m.atelier.count(0))).not.toBeInTheDocument();
	});

	it('shows why the atelier did not load', async () => {
		renderAtelier([], m.collectionErrors.network);

		await expect.element(page.getByText(m.atelier.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
	});

	describe('on a larger screen', () => {
		it('expands and collapses the side menu', async () => {
			renderAtelier();

			await page.getByRole('button', { name: m.menu.expand }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.collapse }))
				.toHaveAttribute('aria-expanded', 'true');
			await expect.element(page.getByRole('img', { name: m.app.name })).toBeVisible();

			await page.getByRole('button', { name: m.menu.collapse }).click();

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.toHaveAttribute('aria-expanded', 'false');
		});

		it('links to the trash and has no menu icon in the top bar', async () => {
			renderAtelier();

			await expect
				.element(page.getByRole('link', { name: m.menu.trash }))
				.toHaveAttribute('href', '/atelier/trash');
			await expect.element(page.getByText(TEST_EMAIL)).toBeInTheDocument();
			await expect.element(page.getByRole('button', { name: m.menu.open })).not.toBeInTheDocument();
		});

		it('signs out and returns to sign-in', async () => {
			signOut.mockResolvedValue({ error: null });
			renderAtelier();

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await vi.waitFor(() =>
				expect(goto).toHaveBeenCalledWith('/sign-in', { invalidateAll: true })
			);
			expect(signOut).toHaveBeenCalledOnce();
		});

		it('disables sign out while signing out', async () => {
			signOut.mockReturnValue(pending());
			renderAtelier();

			await page.getByRole('button', { name: m.menu.signOut }).click();

			await expect.element(page.getByRole('button', { name: m.menu.signOut })).toBeDisabled();
			expect(goto).not.toHaveBeenCalled();
		});
	});

	describe('on a phone', () => {
		beforeEach(async () => {
			await page.viewport(390, 800);
		});

		it('opens the menu from the top bar and closes it', async () => {
			renderAtelier();

			await expect
				.element(page.getByRole('button', { name: m.menu.expand }))
				.not.toBeInTheDocument();

			await page.getByRole('button', { name: m.menu.open }).click();

			const drawer = page.getByRole('dialog', { name: m.menu.label });
			await expect.element(drawer).toBeVisible();
			await expect.element(drawer.getByRole('link', { name: m.menu.trash })).toBeVisible();
			await expect.element(drawer.getByRole('button', { name: m.menu.signOut })).toBeVisible();

			await page.getByRole('button', { name: m.menu.close }).click();

			await expect.element(drawer).not.toBeInTheDocument();
		});

		it('shows the add button as an icon with an accessible name', async () => {
			renderAtelier();

			await expect.element(page.getByRole('link', { name: m.atelier.add })).toBeVisible();
			await expect.element(page.getByText(m.atelier.add, { exact: true })).not.toBeVisible();
		});
	});
});
