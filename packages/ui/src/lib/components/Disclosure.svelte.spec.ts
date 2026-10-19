import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Disclosure from './Disclosure.svelte';

const content = createRawSnippet(() => ({ render: () => '<p>Group content</p>' }));

describe('Disclosure', () => {
	it('names the group in a heading of the chosen level with its count', async () => {
		render(Disclosure, { title: 'Antiquity', count: 12, level: 3, children: content });

		await expect
			.element(page.getByRole('heading', { level: 3 }))
			.toHaveTextContent(/Antiquity\s*12/);
		await expect.element(page.getByText('Group content')).toBeVisible();
	});

	it('draws a lazy content only while open and reports a toggle', async () => {
		const ontoggle = vi.fn();
		render(Disclosure, {
			title: 'Antiquity',
			open: false,
			lazy: true,
			ontoggle,
			children: content
		});

		await expect.element(page.getByText('Group content')).not.toBeInTheDocument();

		await page.getByRole('heading', { name: 'Antiquity' }).click();

		await expect.element(page.getByText('Group content')).toBeVisible();
		expect(ontoggle).toHaveBeenLastCalledWith(true);
	});
});
