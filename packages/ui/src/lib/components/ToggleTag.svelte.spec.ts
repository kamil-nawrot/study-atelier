import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ToggleTag from './ToggleTag.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Baroque</span>' }));

describe('ToggleTag', () => {
	it('is a button that is not pressed by default', async () => {
		render(ToggleTag, { children: label });

		await expect
			.element(page.getByRole('button', { name: 'Baroque' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	it('shows its count after the text', async () => {
		render(ToggleTag, { children: label, count: 12 });

		await expect.element(page.getByRole('button', { name: 'Baroque 12' })).toBeVisible();
	});

	it('shows a count of zero', async () => {
		render(ToggleTag, { children: label, count: 0 });

		await expect.element(page.getByRole('button', { name: 'Baroque 0' })).toBeVisible();
	});

	it('is pressed when asked to be', async () => {
		render(ToggleTag, { children: label, pressed: true });

		await expect
			.element(page.getByRole('button', { name: 'Baroque' }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('toggles and reports the click', async () => {
		const onclick = vi.fn();
		render(ToggleTag, { children: label, onclick });

		await page.getByRole('button', { name: 'Baroque' }).click();

		await expect
			.element(page.getByRole('button', { name: 'Baroque' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(onclick).toHaveBeenCalledOnce();

		await page.getByRole('button', { name: 'Baroque' }).click();

		await expect
			.element(page.getByRole('button', { name: 'Baroque' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	it('does nothing when disabled', async () => {
		const onclick = vi.fn();
		render(ToggleTag, { children: label, disabled: true, onclick });

		await expect.element(page.getByRole('button', { name: 'Baroque' })).toBeDisabled();
		expect(onclick).not.toHaveBeenCalled();
	});
});
