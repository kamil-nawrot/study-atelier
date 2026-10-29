import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { m } from '#lib/i18n/i18n.ts';
import { hideLoadingScreen, LOADING_SCREEN_ID, takeOverLoadingScreen } from './loading-screen.ts';

function serveLoadingScreen(): void {
	const container = document.createElement('div');
	container.id = LOADING_SCREEN_ID;
	container.innerHTML = `<div role="status"><svg aria-label="${m.ui.loading}" role="img"></svg></div>`;
	document.body.appendChild(container);
}

describe('loading screen', () => {
	afterEach(() => {
		hideLoadingScreen();
	});

	it('removes the screen that came with the page once the app hides it', async () => {
		serveLoadingScreen();
		await expect.element(page.getByRole('img', { name: m.ui.loading })).toBeInTheDocument();

		hideLoadingScreen();

		await expect.element(page.getByRole('img', { name: m.ui.loading })).not.toBeInTheDocument();
		expect(document.getElementById(LOADING_SCREEN_ID)).toBeNull();
	});

	it('does nothing when the page came without a screen', async () => {
		takeOverLoadingScreen();

		await expect.element(page.getByRole('status')).not.toBeInTheDocument();
	});
});
