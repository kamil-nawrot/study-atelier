import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/index.ts';
import { testSession } from '#lib/testing/auth.ts';
import ArtworkPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/42'),
	state: {} as App.PageState
}));

vi.mock('$app/state', () => ({ page: navigation }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function renderPage(): void {
	render(ArtworkPage, { data: { session: testSession() }, params: { number: '42' } });
}

describe('artwork page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		navigation.state = {};
	});

	it('names the artwork by its record number and links to editing it', async () => {
		renderPage();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.comingSoon.artwork('#0042'));
		await expect
			.element(page.getByRole('link', { name: m.comingSoon.edit }))
			.toHaveAttribute('href', '/atelier/42/edit');
		await expect
			.element(page.getByRole('link', { name: m.comingSoon.backToAtelier }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByText(m.artworkForm.changesSaved('#0042')))
			.not.toBeInTheDocument();
		expect(goto).not.toHaveBeenCalled();
	});

	it('confirms the saved changes once', async () => {
		navigation.state = { saved: 42 };
		renderPage();

		await expect.element(page.getByText(m.artworkForm.changesSaved('#0042'))).toBeVisible();
		expect(goto).toHaveBeenCalledWith('/atelier/42', {
			state: {},
			shallow: true,
			replace: true
		});
	});
});
