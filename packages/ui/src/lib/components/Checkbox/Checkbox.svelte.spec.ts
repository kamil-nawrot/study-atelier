import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
	it('takes a label with links and keeps the links working', async () => {
		const children = createRawSnippet(() => ({
			render: () => '<span>I accept the <a href="/terms">terms</a></span>'
		}));
		render(Checkbox, { children });

		await expect
			.element(page.getByRole('checkbox', { name: 'I accept the terms' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('link', { name: 'terms' }))
			.toHaveAttribute('href', '/terms');
	});

	it('is unchecked by default and named by its label', async () => {
		render(Checkbox, { label: 'Remember me' });

		await expect.element(page.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
	});

	it('starts checked when asked to', async () => {
		render(Checkbox, { label: 'Remember me', checked: true });

		await expect.element(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
	});

	it('toggles when the learner clicks the label', async () => {
		render(Checkbox, { label: 'Remember me' });

		await page.getByText('Remember me').click();
		await expect.element(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();

		await page.getByText('Remember me').click();
		await expect.element(page.getByRole('checkbox', { name: 'Remember me' })).not.toBeChecked();
	});

	it('reports a change to the page', async () => {
		const onchange = vi.fn();
		render(Checkbox, { label: 'Remember me', onchange });

		await page.getByText('Remember me').click();

		expect(onchange).toHaveBeenCalledOnce();
	});

	it('cannot be toggled when disabled', async () => {
		render(Checkbox, { label: 'Remember me', disabled: true });

		await expect.element(page.getByRole('checkbox', { name: 'Remember me' })).toBeDisabled();
	});

	it('passes the form name and value on', async () => {
		render(Checkbox, { label: 'Remember me', name: 'remember', value: 'yes' });

		const input = page.getByRole('checkbox', { name: 'Remember me' });
		await expect.element(input).toHaveAttribute('name', 'remember');
		await expect.element(input).toHaveAttribute('value', 'yes');
	});
});
