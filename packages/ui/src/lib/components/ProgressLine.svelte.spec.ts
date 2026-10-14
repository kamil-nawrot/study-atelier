import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../messages';
import MessagesHost from '../testing/MessagesHost.svelte';
import ProgressLine from './ProgressLine.svelte';

describe('ProgressLine', () => {
	it('is a progress bar named by the loading text', async () => {
		render(ProgressLine);

		await expect
			.element(page.getByRole('progressbar', { name: defaultUiMessages.loading }))
			.toBeInTheDocument();
	});

	it('takes its label from the prop', async () => {
		render(ProgressLine, { label: 'Opening the wall' });

		await expect
			.element(page.getByRole('progressbar', { name: 'Opening the wall' }))
			.toBeInTheDocument();
	});

	it('takes its default label from the messages set for the app', async () => {
		render(MessagesHost, {
			messages: { ...defaultUiMessages, loading: 'Wczytywanie' },
			component: ProgressLine
		});

		await expect
			.element(page.getByRole('progressbar', { name: 'Wczytywanie' }))
			.toBeInTheDocument();
	});
});
