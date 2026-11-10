import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PanelHeader from './PanelHeader.svelte';

describe('PanelHeader', () => {
	it('names the panel in a heading', async () => {
		render(PanelHeader, { title: 'Filters', foldLabel: 'Fold filters', onfold: vi.fn() });

		await expect.element(page.getByRole('heading', { name: 'Filters', level: 2 })).toBeVisible();
	});

	it('can name the panel in plain text', async () => {
		render(PanelHeader, { as: 'p', title: 'Details', foldLabel: 'Fold details', onfold: vi.fn() });

		await expect.element(page.getByText('Details', { exact: true })).toBeVisible();
		await expect.element(page.getByRole('heading')).not.toBeInTheDocument();
	});

	it('folds the panel with its button and shows the button label as a tooltip', async () => {
		const onfold = vi.fn();
		render(PanelHeader, { title: 'Filters', foldLabel: 'Fold filters', onfold });

		await userEvent.hover(page.getByRole('button', { name: 'Fold filters' }));
		await expect.element(page.getByRole('tooltip')).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: 'Fold filters' }))
			.not.toHaveAccessibleDescription();

		await page.getByRole('button', { name: 'Fold filters' }).click();

		expect(onfold).toHaveBeenCalledTimes(1);
	});
});
