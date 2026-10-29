import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../../messages/messages';
import MessagesHost from '../../testing/MessagesHost.svelte';
import LoadingScreen from './LoadingScreen.svelte';

describe('LoadingScreen', () => {
	it('announces itself as a status with the library text', async () => {
		render(LoadingScreen);

		const status = page.getByRole('status');
		await expect.element(status).toBeVisible();
		await expect
			.element(page.getByRole('img', { name: defaultUiMessages.loading }))
			.toBeInTheDocument();
	});

	it('uses its own label', async () => {
		render(LoadingScreen, { label: 'Opening the atelier' });

		await expect
			.element(page.getByRole('img', { name: 'Opening the atelier' }))
			.toBeInTheDocument();
	});

	it('uses the loading text set with setUiMessages', async () => {
		render(MessagesHost, {
			props: {
				component: LoadingScreen as never,
				messages: { ...defaultUiMessages, loading: 'Ładowanie' }
			}
		});

		await expect.element(page.getByRole('img', { name: 'Ładowanie' })).toBeInTheDocument();
	});

	it('gives two screens at once their own paint patterns', async () => {
		render(LoadingScreen);
		render(LoadingScreen);

		const ids = [...document.querySelectorAll('pattern')].map((pattern) => pattern.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
