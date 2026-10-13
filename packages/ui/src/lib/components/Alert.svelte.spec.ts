import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages, type AlertTone } from '../messages';
import MessagesHost from '../testing/MessagesHost.svelte';
import Alert from './Alert.svelte';

const body = createRawSnippet(() => ({ render: () => '<span>Check the form</span>' }));
const tones: AlertTone[] = ['danger', 'warning', 'success'];

describe('Alert', () => {
	it.each(tones)('labels a %s alert with its default library text', async (tone) => {
		render(Alert, { tone, children: body });

		await expect.element(page.getByText(defaultUiMessages.alert[tone])).toBeVisible();
	});

	it('is announced as an alert when it is a danger', async () => {
		render(Alert, { tone: 'danger', children: body });

		await expect.element(page.getByRole('alert')).toHaveTextContent('Check the form');
	});

	it.each<AlertTone>(['warning', 'success'])('is a status when it is a %s', async (tone) => {
		render(Alert, { tone, children: body });

		await expect.element(page.getByRole('status')).toHaveTextContent('Check the form');
		expect(page.getByRole('alert').elements()).toHaveLength(0);
	});

	it('shows the title above the message', async () => {
		render(Alert, { tone: 'danger', title: 'Could not save', children: body });

		await expect.element(page.getByText('Could not save')).toBeVisible();
		await expect.element(page.getByText('Check the form')).toBeVisible();
	});

	it('works without a message or a title', async () => {
		render(Alert, { tone: 'success' });

		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(defaultUiMessages.alert.success);
	});

	it('prefers its own label to the library text', async () => {
		render(Alert, { tone: 'danger', label: 'Sign-in failed', children: body });

		await expect.element(page.getByText('Sign-in failed')).toBeVisible();
		expect(page.getByText(defaultUiMessages.alert.danger).elements()).toHaveLength(0);
	});

	it('uses the labels set with setUiMessages', async () => {
		render(MessagesHost, {
			props: {
				component: Alert as never,
				props: { tone: 'warning', children: body },
				messages: { ...defaultUiMessages, alert: { ...defaultUiMessages.alert, warning: 'Uwaga' } }
			}
		});

		await expect.element(page.getByText('Uwaga')).toBeVisible();
	});
});
