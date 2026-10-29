import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import FilterValues from './FilterValues.svelte';
import '@study-atelier/ui/styles.css';

const options = Array.from({ length: 12 }, (_, index) => ({
	value: `Author ${String.fromCharCode(65 + index)}`,
	count: 12 - index
}));

function props(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		title: 'Authors',
		options,
		chosen: [],
		name: (value: string) => value,
		onchoose: () => {},
		...overrides
	};
}

describe('FilterValues', () => {
	it('shows each value with the number of artworks', async () => {
		render(FilterValues, props());

		await expect.element(page.getByRole('heading', { name: 'Authors' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Author A 12' })).toBeVisible();
	});

	it('shows nothing when there are no values', async () => {
		render(FilterValues, props({ options: [] }));

		await expect.element(page.getByRole('heading', { name: 'Authors' })).not.toBeInTheDocument();
	});

	it('marks the chosen values and reports a click', async () => {
		const onchoose = vi.fn();
		render(FilterValues, props({ chosen: ['Author B'], onchoose }));

		await expect
			.element(page.getByRole('button', { name: 'Author B 11' }))
			.toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', { name: 'Author C 10' }).click();

		expect(onchoose).toHaveBeenCalledExactlyOnceWith('Author C');
	});

	it('shows the most frequent values first and the rest after "show more"', async () => {
		render(FilterValues, props({ limit: 8 }));

		await expect.element(page.getByRole('button', { name: /^Author H/ })).toBeVisible();
		await expect.element(page.getByRole('button', { name: /^Author I/ })).not.toBeInTheDocument();

		await page.getByRole('button', { name: m.atelier.filters.showMore }).click();

		await expect.element(page.getByRole('button', { name: /^Author L/ })).toBeVisible();

		await page.getByRole('button', { name: m.atelier.filters.showLess }).click();

		await expect.element(page.getByRole('button', { name: /^Author L/ })).not.toBeInTheDocument();
	});

	it('keeps a chosen value visible although it is beyond the limit', async () => {
		render(FilterValues, props({ limit: 8, chosen: ['Author L'] }));

		await expect.element(page.getByRole('button', { name: /^Author L/ })).toBeVisible();
		await expect.element(page.getByRole('button', { name: /^Author K/ })).not.toBeInTheDocument();
	});

	it('searches in all values, ignoring case and diacritics', async () => {
		render(
			FilterValues,
			props({
				limit: 8,
				searchLabel: 'Search authors',
				options: [...options, { value: 'Łukasz Nowak', count: 1 }]
			})
		);

		await userEvent.fill(page.getByRole('searchbox', { name: 'Search authors' }), 'lukasz');

		await expect.element(page.getByRole('button', { name: /^Łukasz Nowak/ })).toBeVisible();
		await expect.element(page.getByRole('button', { name: /^Author A/ })).not.toBeInTheDocument();
	});
});
