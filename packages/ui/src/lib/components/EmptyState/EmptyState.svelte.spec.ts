import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import BookA from '@lucide/svelte/icons/book-a';
import EmptyState from './EmptyState.svelte';

describe('EmptyState', () => {
	it('heads an empty module with its title, text and action', async () => {
		render(EmptyState, {
			icon: BookA,
			title: 'Słowniczek jest jeszcze pusty',
			text: 'Dodaj pierwsze pojęcie.',
			children: createRawSnippet(() => ({
				render: () => '<a href="/new">Dodaj pierwsze pojęcie</a>'
			}))
		});

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent('Słowniczek jest jeszcze pusty');
		await expect.element(page.getByText('Dodaj pierwsze pojęcie.')).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: 'Dodaj pierwsze pojęcie' }))
			.toHaveAttribute('href', '/new');
	});

	it('shows an empty part of a page as one sentence without a heading', async () => {
		render(EmptyState, { icon: BookA, text: 'Nie ma tu jeszcze materiałów.' });

		await expect.element(page.getByText('Nie ma tu jeszcze materiałów.')).toBeVisible();
		expect(page.getByRole('heading').elements()).toHaveLength(0);
		expect(page.getByRole('img').elements()).toHaveLength(0);
	});
});
