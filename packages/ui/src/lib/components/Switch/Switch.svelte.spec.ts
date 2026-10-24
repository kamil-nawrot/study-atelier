import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Switch from './Switch.svelte';

describe('Switch', () => {
	it('is off by default and named by its label', async () => {
		render(Switch, { label: 'Period' });

		await expect.element(page.getByRole('switch', { name: 'Period' })).not.toBeChecked();
	});

	it('starts on when asked to', async () => {
		render(Switch, { label: 'Period', checked: true });

		await expect.element(page.getByRole('switch', { name: 'Period' })).toBeChecked();
	});

	it('toggles when the learner clicks the label', async () => {
		render(Switch, { label: 'Period' });

		await page.getByText('Period').click();
		await expect.element(page.getByRole('switch', { name: 'Period' })).toBeChecked();

		await page.getByText('Period').click();
		await expect.element(page.getByRole('switch', { name: 'Period' })).not.toBeChecked();
	});

	it('reports a change to the page', async () => {
		const onchange = vi.fn();
		render(Switch, { label: 'Period', onchange });

		await page.getByText('Period').click();

		expect(onchange).toHaveBeenCalledOnce();
	});

	it('cannot be toggled when disabled', async () => {
		render(Switch, { label: 'Period', disabled: true });

		await expect.element(page.getByRole('switch', { name: 'Period' })).toBeDisabled();
	});
});
