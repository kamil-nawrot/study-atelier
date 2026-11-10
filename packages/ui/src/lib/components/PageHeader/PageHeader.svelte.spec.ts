import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import PageHeader from './PageHeader.svelte';

const count = createRawSnippet(() => ({ render: () => '<span>4 visits</span>' }));
const filter = createRawSnippet(() => ({ render: () => '<button type="button">Filters</button>' }));

function box(text: string): DOMRect {
	return page.getByText(text).element().getBoundingClientRect();
}

describe('PageHeader', () => {
	it('shows the lead without a heading of its own', async () => {
		render(PageHeader, { lead: 'Your museum visits.' });

		await expect.element(page.getByText('Your museum visits.')).toHaveClass('lead');
		expect(document.querySelector('h1')).toBeNull();
	});

	it('puts the count level with the lead on a larger screen and under it on a phone', async () => {
		await page.viewport(1280, 800);
		render(PageHeader, { lead: 'Your visits.', aside: count });
		await expect.element(page.getByText('4 visits')).toBeVisible();

		expect(box('4 visits').left).toBeGreaterThanOrEqual(box('Your visits.').right);
		expect(box('4 visits').top).toBeLessThan(box('Your visits.').bottom);

		await page.viewport(390, 844);

		await expect.poll(() => box('4 visits').top).toBeGreaterThanOrEqual(box('Your visits.').bottom);
		expect(box('4 visits').left).toBe(box('Your visits.').left);
	});

	it('keeps an action level with the lead, at its right, on a phone', async () => {
		await page.viewport(390, 844);
		render(PageHeader, { lead: 'Your visits.', actions: filter });

		const button = page.getByRole('button', { name: 'Filters' });
		await expect.element(button).toBeVisible();
		const control = button.element().getBoundingClientRect();
		expect(control.left).toBeGreaterThanOrEqual(box('Your visits.').right);
		expect(control.top).toBeLessThan(box('Your visits.').bottom);
	});
});
