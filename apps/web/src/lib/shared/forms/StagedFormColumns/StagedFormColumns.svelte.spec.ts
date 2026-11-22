import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StagedFormColumns from './StagedFormColumns.svelte';

const head = createRawSnippet(() => ({ render: () => '<label>Tytuł <input /></label>' }));
const images = createRawSnippet(() => ({ render: () => '<p>Scena</p>' }));
const fields = createRawSnippet(() => ({ render: () => '<p>Notatki</p>' }));

function boxOf(text: string): DOMRect {
	return page.getByText(text).element().getBoundingClientRect();
}

function renderColumns(onfocusin = vi.fn()): void {
	render(StagedFormColumns, { actionsHeight: 80, onfocusin, head, images, fields });
}

describe('StagedFormColumns', () => {
	it('puts the stage above the title on a phone', async () => {
		await page.viewport(390, 844);
		renderColumns();

		await expect.element(page.getByText('Scena')).toBeVisible();
		expect(boxOf('Scena').bottom).toBeLessThanOrEqual(boxOf('Tytuł').top);
	});

	it('puts the stage on the left half beside the form from 768 px', async () => {
		await page.viewport(1280, 800);
		renderColumns();

		await expect.element(page.getByText('Scena')).toBeVisible();
		const stage = page.getByText('Scena').element().parentElement as Element;
		expect(stage.getBoundingClientRect().right).toBeLessThanOrEqual(boxOf('Tytuł').left);
		expect(boxOf('Notatki').top).toBeGreaterThan(boxOf('Tytuł').top);
	});

	it('tells the form when a field gets the focus', async () => {
		const onfocusin = vi.fn();
		renderColumns(onfocusin);

		await page.getByRole('textbox', { name: 'Tytuł' }).click();

		expect(onfocusin).toHaveBeenCalled();
	});
});
