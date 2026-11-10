import { describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import '@study-atelier/ui/styles.css';
import FilterSidePanel from './FilterSidePanel.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>Tools</p>' }));

document.documentElement.style.setProperty('--filter-panel-width', '380px');
document.documentElement.style.setProperty('--docked-panel-width', '48px');
document.documentElement.style.setProperty('--bar-height', '0px');

describe('FilterSidePanel', () => {
	it('shows its content under a title and closes with its button', async () => {
		render(FilterSidePanel, { open: true, title: 'Filters', closeLabel: 'Close', children });

		await expect.element(page.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
		await expect.element(page.getByText('Tools')).toBeVisible();
		await userEvent.click(page.getByRole('button', { name: 'Close' }));

		await expect.element(page.getByText('Tools')).not.toBeInTheDocument();
		expect(document.querySelector('.slot')?.getBoundingClientRect().width).toBe(0);
	});

	it('clears the filters with a text button that waits for a filter', async () => {
		const onclear = vi.fn();
		const { rerender } = await render(FilterSidePanel, {
			open: true,
			title: 'Filters',
			filtering: false,
			onclear,
			children
		});

		const clear = page.getByRole('button', { name: m.atelier.filters.clear });
		await expect.element(clear).toBeDisabled();
		await rerender({ filtering: true });
		await clear.click();

		expect(onclear).toHaveBeenCalledTimes(1);
	});

	it('leaves an upright strip when it is docked and opens again from it', async () => {
		render(FilterSidePanel, {
			open: false,
			title: 'Toolbox',
			strip: 'Toolbox',
			openLabel: 'Open toolbox',
			closeLabel: 'Close',
			children
		});

		const strip = page.getByRole('button', { name: 'Open toolbox' });
		await expect.element(strip).toBeVisible();
		expect(document.querySelector('.slot')?.getBoundingClientRect().width).toBe(48);
		expect(getComputedStyle(document.querySelector('.strip-label') as Element).writingMode).toBe(
			'vertical-rl'
		);
		await userEvent.click(strip);

		await expect.element(page.getByText('Tools')).toBeVisible();
		await expect.element(strip).not.toBeInTheDocument();
	});
});
