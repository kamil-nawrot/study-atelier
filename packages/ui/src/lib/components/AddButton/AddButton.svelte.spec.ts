import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import AddButton from './AddButton.svelte';

describe('AddButton', () => {
	it('links to the add form under its label', async () => {
		render(AddButton, { label: 'Add a term', href: '/glossary/new' });

		await expect
			.element(page.getByRole('link', { name: 'Add a term' }))
			.toHaveAttribute('href', '/glossary/new');
	});

	it('shows the plus alone on a phone, with the label in a tooltip on focus', async () => {
		await page.viewport(390, 844);
		render(AddButton, { label: 'Add a term', href: '/glossary/new' });
		const link = page.getByRole('link', { name: 'Add a term' });

		await expect.element(link.getByText('Add a term')).not.toBeVisible();
		link.element().focus();
		await expect.element(page.getByRole('tooltip')).toBeVisible();
	});

	it('shows the label on a larger screen, without the tooltip', async () => {
		await page.viewport(1280, 800);
		render(AddButton, { label: 'Add a term', href: '/glossary/new' });
		const link = page.getByRole('link', { name: 'Add a term' });

		await expect.element(link.getByText('Add a term')).toBeVisible();
		link.element().focus();
		const bubble = document.querySelector('[role="tooltip"]') as HTMLElement;
		expect(getComputedStyle(bubble).visibility).toBe('hidden');
	});
});
