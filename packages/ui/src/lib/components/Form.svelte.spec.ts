import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Form from './Form.svelte';

const fields = createRawSnippet(() => ({
	render: () => `
		<div>
			<input aria-label="Title" />
			<div style="height: 2000px"></div>
			<input aria-invalid="true" aria-label="Year" />
			<button type="submit">Save</button>
		</div>
	`
}));

describe('Form', () => {
	it('calls onsubmit without reloading the page', async () => {
		const onsubmit = vi.fn();
		render(Form, { onsubmit, children: fields });

		await page.getByRole('button', { name: 'Save' }).click();

		expect(onsubmit).toHaveBeenCalledOnce();
	});

	it('moves focus to the first invalid field and scrolls it into view', async () => {
		await page.viewport(400, 600);
		render(Form, { onsubmit: vi.fn(), children: fields });

		await page.getByRole('button', { name: 'Save' }).click();

		const year = page.getByRole('textbox', { name: 'Year' });
		await expect.element(year).toHaveFocus();
		await expect.element(year).toBeInViewport();
	});
});
