import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import Tabs from './Tabs.svelte';

const panel = createRawSnippet(() => ({ render: () => '<p>Panel content</p>' }));
const panelWithBar = createRawSnippet(() => ({
	render: () => '<div><footer data-action-bar>Save</footer></div>'
}));

const tabs = [
	{ value: 'periods', label: 'Periods' },
	{ value: 'materials', label: 'Materials' },
	{ value: 'authors', label: 'Authors' }
];

function renderTabs(value?: string): void {
	render(Tabs, { label: 'Kinds', tabs, value, children: panel });
}

describe('Tabs', () => {
	it('lets a save bar in the panel reach the bottom of the page', async () => {
		render(Tabs, { label: 'Kinds', tabs, children: panelWithBar });

		const tabPanel = page.getByRole('tabpanel').element();
		await expect.element(page.getByText('Save')).toBeVisible();
		expect(getComputedStyle(tabPanel).paddingBottom).toBe('0px');
		expect(getComputedStyle(tabPanel).borderBottomStyle).toBe('none');
	});

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

	it('puts a tab marked as end at the right edge of the list', async () => {
		await page.viewport(1280, 800);
		render(Tabs, {
			label: 'Kinds',
			tabs: [...tabs, { value: 'own', label: 'Own', end: true }],
			children: panel
		});

		const list = page.getByRole('tablist').element().getBoundingClientRect();
		const own = page.getByRole('tab', { name: 'Own' }).element().getBoundingClientRect();
		const authors = page.getByRole('tab', { name: 'Authors' }).element().getBoundingClientRect();
		expect(own.right).toBeCloseTo(list.right, 0);
		expect(own.left - authors.right).toBeGreaterThan(100);
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

	it('joins the selected tab to the framed panel', async () => {
		renderTabs();

		const tab = page.getByRole('tab', { name: 'Periods' }).element();
		const panelBox = page.getByRole('tabpanel').element();
		const tabStyle = getComputedStyle(tab);
		const panelStyle = getComputedStyle(panelBox);
		expect(tabStyle.borderLeftStyle).toBe('solid');
		expect(tabStyle.borderBottomColor).toBe(tabStyle.backgroundColor);
		expect(panelStyle.borderLeftStyle).toBe('solid');
		expect(panelStyle.borderTopStyle).toBe('none');
		expect(panelBox.getBoundingClientRect().top).toBeCloseTo(tab.getBoundingClientRect().bottom, 0);
	});

	it('scrolls the selected tab into view in a narrow list', async () => {
		await page.viewport(320, 800);
		render(Tabs, {
			label: 'Kinds',
			tabs: [
				{ value: 'periods', label: 'Periods and styles' },
				{ value: 'materials', label: 'Materials and techniques' },
				{ value: 'authors', label: 'Authors and workshops' },
				{ value: 'places', label: 'Places and collections' }
			],
			value: 'places',
			children: panel
		});

		const list = page.getByRole('tablist').element().getBoundingClientRect();
		const places = page.getByRole('tab', { name: 'Places and collections' });
		await expect
			.poll(() => places.element().getBoundingClientRect().right)
			.toBeLessThanOrEqual(list.right + 1);
	});
});
