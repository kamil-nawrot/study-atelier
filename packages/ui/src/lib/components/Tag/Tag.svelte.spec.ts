import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { defaultUiMessages } from '../messages';
import MessagesHost from '../testing/MessagesHost.svelte';
import Tag from './Tag.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Baroque</span>' }));

describe('Tag', () => {
	it('shows its text', async () => {
		render(Tag, { children: label });

		await expect.element(page.getByText('Baroque')).toBeVisible();
	});

	it('has no remove button unless it can be removed', async () => {
		render(Tag, { children: label });

		expect(page.getByRole('button').elements()).toHaveLength(0);
	});

	it('names the remove button with the library text', async () => {
		render(Tag, { children: label, onremove: () => {} });

		await expect
			.element(page.getByRole('button', { name: defaultUiMessages.removeTag }))
			.toBeVisible();
	});

	it('calls onremove when the learner removes it', async () => {
		const onremove = vi.fn();
		render(Tag, { children: label, onremove });

		await page.getByRole('button', { name: defaultUiMessages.removeTag }).click();

		expect(onremove).toHaveBeenCalledOnce();
	});

	it('disables the remove button and does not call onremove', async () => {
		const onremove = vi.fn();
		render(Tag, { children: label, onremove, removeDisabled: true });

		await expect
			.element(page.getByRole('button', { name: defaultUiMessages.removeTag }))
			.toBeDisabled();
		expect(onremove).not.toHaveBeenCalled();
	});

	it('names the remove button with its own label', async () => {
		render(Tag, { children: label, onremove: () => {}, removeLabel: 'Remove Baroque' });

		await expect.element(page.getByRole('button', { name: 'Remove Baroque' })).toBeVisible();
	});

	it('uses the remove text set with setUiMessages', async () => {
		render(MessagesHost, {
			props: {
				component: Tag as never,
				props: { children: label, onremove: () => {} },
				messages: { ...defaultUiMessages, removeTag: 'Usuń tag' }
			}
		});

		await expect.element(page.getByRole('button', { name: 'Usuń tag' })).toBeVisible();
	});
});
