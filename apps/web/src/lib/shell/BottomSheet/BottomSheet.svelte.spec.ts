import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import BottomSheet from './BottomSheet.svelte';

async function renderSheet(): Promise<ReturnType<typeof BottomSheet>> {
	const { component } = await render(BottomSheet, {
		label: 'Sheet',
		closeLabel: 'Close the sheet',
		children: createRawSnippet(() => ({ render: () => '<a href="/atelier/trash">Trash</a>' }))
	});
	return component;
}

describe('BottomSheet', () => {
	it('opens at the bottom of the screen and closes with its button', async () => {
		await page.viewport(390, 844);
		const sheet = await renderSheet();

		sheet.open();
		const dialog = page.getByRole('dialog', { name: 'Sheet' });
		await expect.element(dialog.getByRole('link', { name: 'Trash' })).toBeVisible();
		await expect
			.poll(() => dialog.element().getBoundingClientRect().bottom)
			.toBeCloseTo(window.innerHeight, 0);

		await page.getByRole('button', { name: 'Close the sheet' }).click();

		await expect.element(dialog).not.toBeInTheDocument();
	});

	it('stays open after a tap on its own padding and closes after a tap above it', async () => {
		await page.viewport(390, 844);
		const sheet = await renderSheet();
		sheet.open();
		const dialog = page.getByRole('dialog', { name: 'Sheet' });
		await expect.element(dialog).toBeVisible();
		const box = dialog.element().getBoundingClientRect();
		const click = (y: number): void => {
			dialog
				.element()
				.dispatchEvent(
					new MouseEvent('click', { bubbles: true, clientX: box.left + 2, clientY: y })
				);
		};

		click(box.bottom - 2);
		await expect.element(dialog).toBeVisible();
		click(box.top - 20);
		await expect.element(dialog).not.toBeInTheDocument();
	});

	it('closes when a link in it is picked', async () => {
		const sheet = await renderSheet();
		sheet.open();
		const link = page.getByRole('link', { name: 'Trash' });
		await expect.element(link).toBeVisible();

		link.element().addEventListener('click', (event) => event.preventDefault());
		await link.click();

		await expect.element(page.getByRole('dialog', { name: 'Sheet' })).not.toBeInTheDocument();
	});
});
