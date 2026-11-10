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

	it('scrolls its heading back into view when a long list folds', async () => {
		const host = document.createElement('div');
		host.style.height = '200px';
		host.style.overflowY = 'auto';
		document.body.appendChild(host);
		const many = Array.from({ length: 80 }, (_, index) => ({
			value: `Author ${index}`,
			count: 1
		}));
		render(FilterValues, { target: host, props: props({ limit: 8, options: many }) });
		const after = document.createElement('div');
		after.style.height = '2000px';
		host.append(after);

		await page.getByRole('button', { name: m.atelier.filters.showMore }).click();
		await expect.element(page.getByRole('button', { name: /^Author 79/ })).toBeVisible();
		host.scrollTop = host.scrollHeight;

		await page.getByRole('button', { name: m.atelier.filters.showLess }).click();

		await expect.element(page.getByRole('button', { name: /^Author 79/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Authors' })).toBeInViewport();
		host.remove();
	});

	it('cuts a long value to one line and keeps its whole name in a title', async () => {
		const host = document.createElement('div');
		host.style.width = '200px';
		document.body.appendChild(host);
		const long = 'A very long name of a style that does not fit on one line of the panel';
		render(FilterValues, {
			target: host,
			props: props({ options: [{ value: long, count: 3 }] })
		});

		const button = page.getByRole('button', { name: `${long} 3` });
		await expect.element(button).toBeVisible();
		expect(button.element().getBoundingClientRect().width).toBeLessThanOrEqual(200);
		const name = page.getByTitle(long).element();
		expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
		expect(button.element().getBoundingClientRect().height).toBeLessThan(40);
		host.remove();
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
