import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import AddButton from './AddButton.svelte';

describe('AddButton', () => {
	it('links to the add form under its label on a larger screen', async () => {
		await page.viewport(1280, 800);
		render(AddButton, { label: 'Add a term', href: '/glossary/new' });
		const link = page.getByRole('link', { name: 'Add a term' });

		await expect.element(link).toHaveAttribute('href', '/glossary/new');
		await expect.element(link.getByText('Add a term')).toBeVisible();
	});

	it('is not shown on a phone, where the bottom bar adds', async () => {
		await page.viewport(390, 844);
		render(AddButton, { label: 'Add a term', href: '/glossary/new' });

		await expect.element(page.getByText('Add a term')).not.toBeVisible();
	});
});
