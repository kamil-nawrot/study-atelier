import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PageHeader from './PageHeader.svelte';

const count = createRawSnippet(() => ({ render: () => '<span>4 visits</span>' }));
const filter = createRawSnippet(() => ({ render: () => '<button type="button">Filters</button>' }));

describe('PageHeader', () => {
	it('shows the title as the page heading with the lead under it', async () => {
		render(PageHeader, { title: 'Chronicle', lead: 'Your museum visits.' });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Chronicle');
		await expect.element(page.getByText('Your museum visits.')).toHaveClass('lead');
	});

	it('leaves the lead out when there is none', async () => {
		render(PageHeader, { title: 'Chronicle' });

		expect(document.querySelector('.lead')).toBeNull();
	});

	it('shows a count beside the title and actions beside the heading', async () => {
		render(PageHeader, { title: 'Chronicle', lead: 'Your visits.', aside: count, actions: filter });

		await expect.element(page.getByText('4 visits')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Filters' })).toBeVisible();
	});
});
