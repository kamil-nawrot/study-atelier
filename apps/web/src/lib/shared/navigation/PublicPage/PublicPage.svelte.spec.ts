import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import PublicPage from './PublicPage.svelte';

const state = vi.hoisted(() => ({
	url: new URL('http://localhost/'),
	data: {} as { session?: object | null }
}));

vi.mock('$app/state', () => ({ page: state }));

const children = createRawSnippet(() => ({ render: () => '<main>Treść</main>' }));

async function renderAt(path: string, session: object | null = null): Promise<void> {
	await page.viewport(1280, 800);
	state.url = new URL(`http://localhost${path}`);
	state.data = { session };
	render(PublicPage, { children });
}

beforeEach(() => {
	state.data = {};
});

describe('PublicPage', () => {
	it('offers only signing in on the start page, with the logo leading home', async () => {
		await renderAt('/');

		await expect.element(page.getByRole('link', { name: m.app.name })).toHaveAttribute('href', '/');
		await expect
			.element(page.getByRole('link', { name: m.landing.signIn }))
			.toHaveAttribute('href', '/sign-in');
		await expect
			.element(page.getByRole('link', { name: m.landing.signUp }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText('Treść')).toBeVisible();
	});

	it('offers both account actions on a legal page and keeps only signing in on a phone', async () => {
		await renderAt('/terms');

		await expect
			.element(page.getByRole('link', { name: m.landing.signUp }))
			.toHaveAttribute('href', '/sign-up');
		await page.viewport(390, 844);
		await expect.element(page.getByRole('link', { name: m.landing.signIn })).toBeVisible();
		await expect.element(page.getByText(m.landing.signUp)).not.toBeVisible();
	});

	it('shows only the logo above a form', async () => {
		await renderAt('/sign-in');

		await expect.element(page.getByRole('link', { name: m.app.name })).toHaveAttribute('href', '/');
		await expect
			.element(page.getByRole('navigation', { name: m.publicHeader.label }))
			.not.toBeInTheDocument();
	});

	it('takes a signed-in learner back to the atelier instead', async () => {
		await renderAt('/terms', {});

		await expect
			.element(page.getByRole('link', { name: m.publicHeader.toAtelier }))
			.toHaveAttribute('href', '/atelier');
		await expect
			.element(page.getByRole('link', { name: m.landing.signIn }))
			.not.toBeInTheDocument();
	});
});
