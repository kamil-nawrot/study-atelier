import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import FieldMessage from './FieldMessage.svelte';

describe('FieldMessage', () => {
	it('shows the error instead of the hint', async () => {
		render(FieldMessage, { id: 'message', hint: 'Up to 5 MB.', error: 'Too large.' });

		await expect.element(page.getByText('Too large.')).toBeVisible();
		await expect.element(page.getByText('Up to 5 MB.')).not.toBeInTheDocument();
	});

	it('renders a hint snippet with its markup', async () => {
		const hint = createRawSnippet(() => ({
			render: () => '<span>Current: <strong>name@example.com</strong></span>'
		}));
		render(FieldMessage, { id: 'message', hint });

		await expect.element(page.getByText('name@example.com')).toHaveProperty('tagName', 'STRONG');
	});

	it('announces changes politely when live', async () => {
		render(FieldMessage, { id: 'message', hint: 'Up to 5 MB.', live: true });

		await expect.element(page.getByText('Up to 5 MB.')).toHaveAttribute('aria-live', 'polite');
	});
});
