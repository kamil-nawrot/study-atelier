import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TextButton from './TextButton.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Collapse all</span>' }));

describe('TextButton', () => {
	it('is a button that acts on a click', async () => {
		const onclick = vi.fn();
		render(TextButton, { children: label, onclick });

		await page.getByRole('button', { name: 'Collapse all' }).click();

		expect(onclick).toHaveBeenCalledOnce();
	});

	it('drops its inline padding in the inline variant', async () => {
		render(TextButton, { children: label, inline: true });

		const button = page.getByRole('button', { name: 'Collapse all' }).element();
		expect(getComputedStyle(button).paddingLeft).toBe('0px');
		expect(getComputedStyle(button).paddingRight).toBe('0px');
	});

	it('can be disabled', async () => {
		render(TextButton, { children: label, disabled: true });

		await expect.element(page.getByRole('button', { name: 'Collapse all' })).toBeDisabled();
	});
});
