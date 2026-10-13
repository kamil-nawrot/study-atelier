import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Tabs from './Tabs.svelte';

const panel = createRawSnippet(() => ({ render: () => '<p>Panel content</p>' }));

const tabs = [
	{ value: 'periods', label: 'Periods' },
	{ value: 'materials', label: 'Materials' },
	{ value: 'authors', label: 'Authors' }
];

function renderTabs(value?: string): void {
	render(Tabs, { label: 'Kinds', tabs, value, children: panel });
}

describe('Tabs', () => {
	it('names the tab list and selects the first tab', async () => {
		renderTabs();

		await expect.element(page.getByRole('tablist', { name: 'Kinds' })).toBeVisible();
		await expect
			.element(page.getByRole('tab', { name: 'Periods' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect
			.element(page.getByRole('tab', { name: 'Materials' }))
			.toHaveAttribute('aria-selected', 'false');
	});

	it('selects the tab given as value', async () => {
		renderTabs('authors');

		await expect
			.element(page.getByRole('tab', { name: 'Authors' }))
			.toHaveAttribute('aria-selected', 'true');
	});

	it('shows the panel of the selected tab', async () => {
		renderTabs();

		await expect
			.element(page.getByRole('tabpanel', { name: 'Periods' }))
			.toHaveTextContent('Panel content');
		await page.getByRole('tab', { name: 'Materials' }).click();

		await expect
			.element(page.getByRole('tab', { name: 'Materials' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('tabpanel', { name: 'Materials' })).toBeVisible();
	});

	it('moves between tabs with the arrow keys, Home and End', async () => {
		renderTabs();
		page.getByRole('tab', { name: 'Periods' }).element().focus();

		await userEvent.keyboard('{ArrowRight}');
		await expect
			.element(page.getByRole('tab', { name: 'Materials' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('tab', { name: 'Materials' })).toHaveFocus();

		await userEvent.keyboard('{End}');
		await expect.element(page.getByRole('tab', { name: 'Authors' })).toHaveFocus();

		await userEvent.keyboard('{ArrowRight}');
		await expect.element(page.getByRole('tab', { name: 'Periods' })).toHaveFocus();

		await userEvent.keyboard('{ArrowLeft}');
		await expect.element(page.getByRole('tab', { name: 'Authors' })).toHaveFocus();

		await userEvent.keyboard('{Home}');
		await expect.element(page.getByRole('tab', { name: 'Periods' })).toHaveFocus();
	});

	it('keeps only the selected tab in the tab order', async () => {
		renderTabs();

		await expect
			.element(page.getByRole('tab', { name: 'Periods' }))
			.toHaveAttribute('tabindex', '0');
		await expect
			.element(page.getByRole('tab', { name: 'Materials' }))
			.toHaveAttribute('tabindex', '-1');
	});
});
