import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import { html } from '../../../stories/snippets';
import { defaultUiMessages } from '../../messages/messages';
import Dialog from './Dialog.svelte';

const closeLabel = defaultUiMessages.closeDialog;

const openers: HTMLButtonElement[] = [];

function addOpener(): HTMLButtonElement {
	const opener = document.createElement('button');
	opener.textContent = 'Find image';
	document.body.append(opener);
	opener.focus();
	openers.push(opener);
	return opener;
}

afterEach(() => {
	openers.splice(0).forEach((opener) => opener.remove());
});

describe('Dialog', () => {
	it('blurs the page under the scrim where the browser supports it', async () => {
		render(Dialog, { open: true, title: 'Which artwork is it?', children: html('<p>Body</p>') });

		const dialog = page.getByRole('dialog', { name: 'Which artwork is it?' }).element();
		const backdrop = getComputedStyle(dialog, '::backdrop');
		expect(backdrop.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		if (CSS.supports('backdrop-filter', 'blur(1px)')) {
			expect(backdrop.backdropFilter).toMatch(/^blur\(/);
		}
	});

	it('opens as a modal named by its title and described by its description', async () => {
		render(Dialog, {
			open: true,
			title: 'Which artwork is it?',
			description: 'Results for “Lady with an Ermine”',
			children: html('<p>Four candidates</p>')
		});

		const dialog = page.getByRole('dialog', { name: 'Which artwork is it?' });
		await expect.element(dialog).toBeVisible();
		await expect.element(dialog).toHaveAccessibleDescription('Results for “Lady with an Ermine”');
		await expect.element(dialog.getByText('Four candidates')).toBeVisible();
		await expect.element(page.getByRole('button', { name: closeLabel })).toHaveFocus();
	});

	it('closes with Escape and returns focus to the element that opened it', async () => {
		const opener = addOpener();
		const onclose = vi.fn();
		render(Dialog, { open: true, title: 'Which artwork is it?', onclose });

		await expect.element(page.getByRole('dialog')).toBeVisible();
		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(opener).toHaveFocus();
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('closes with the close button', async () => {
		const opener = addOpener();
		render(Dialog, { open: true, title: 'Which artwork is it?' });

		await userEvent.click(page.getByRole('button', { name: closeLabel }));

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await expect.element(opener).toHaveFocus();
	});

	it('keeps focus away from the page behind it', async () => {
		const opener = addOpener();
		render(Dialog, {
			open: true,
			title: 'Which artwork is it?',
			footer: html('<button>None of these</button>')
		});

		await expect.element(page.getByRole('dialog')).toBeVisible();
		for (const shift of [true, true, false, false, false]) {
			await userEvent.tab({ shift });
			expect(document.activeElement).not.toBe(opener);
		}
	});

	it('stops the page behind it from scrolling until it closes', async () => {
		render(Dialog, { open: true, title: 'Which artwork is it?' });

		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await vi.waitFor(() =>
			expect(getComputedStyle(document.documentElement).overflow).toBe('visible')
		);
	});

	it('opens and closes when the open prop changes', async () => {
		const { rerender } = await render(Dialog, { title: 'Which artwork is it?' });

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		await rerender({ open: true });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await rerender({ open: false });
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('asks for confirmation in the small size without a close button', async () => {
		render(Dialog, {
			open: true,
			size: 'small',
			title: 'Discard changes?',
			description: 'Your changes will be lost.',
			footer: html('<span><button>Back to the form</button><button>Discard</button></span>')
		});

		const dialog = page.getByRole('alertdialog', { name: 'Discard changes?' });
		await expect.element(dialog).toHaveAccessibleDescription('Your changes will be lost.');
		await expect.element(page.getByRole('button', { name: closeLabel })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Back to the form' })).toHaveFocus();
	});
});
