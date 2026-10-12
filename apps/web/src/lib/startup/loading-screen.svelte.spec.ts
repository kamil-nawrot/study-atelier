import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { m } from '#lib/i18n/index.ts';
import { hideLoadingScreen, showLoadingScreen } from './loading-screen.ts';

describe('loading screen', () => {
	afterEach(() => {
		hideLoadingScreen();
	});

	it('covers the page with the logo mark until the app hides it', async () => {
		showLoadingScreen();

		await expect.element(page.getByRole('img', { name: m.ui.loading })).toBeInTheDocument();
		expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);

		hideLoadingScreen();

		await expect.element(page.getByRole('img', { name: m.ui.loading })).not.toBeInTheDocument();
	});

	it('shows one screen however often it is asked to', async () => {
		showLoadingScreen();
		showLoadingScreen();

		await expect.element(page.getByRole('img', { name: m.ui.loading })).toBeInTheDocument();
		expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
	});
});
