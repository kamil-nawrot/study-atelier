import { describe, expect, it, vi } from 'vitest';
import Pencil from '@lucide/svelte/icons/pencil';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../styles/index.css';
import IconButton from './IconButton.svelte';

describe('IconButton', () => {
	it('is named by its label and shows the label as a tooltip', async () => {
		render(IconButton, { icon: Pencil, label: 'Change photo' });

		await expect.element(page.getByRole('button', { name: 'Change photo' })).toBeVisible();
		await expect.element(page.getByRole('tooltip')).not.toBeVisible();

		await userEvent.hover(page.getByRole('button', { name: 'Change photo' }));

		await expect.element(page.getByRole('tooltip')).toBeVisible();
	});

	it('calls onclick and ignores a click while disabled', async () => {
		const onclick = vi.fn();
		const { rerender } = render(IconButton, { icon: Pencil, label: 'Change photo', onclick });

		await page.getByRole('button', { name: 'Change photo' }).click();
		expect(onclick).toHaveBeenCalledTimes(1);

		await rerender({ icon: Pencil, label: 'Change photo', onclick, disabled: true });
		await expect.element(page.getByRole('button', { name: 'Change photo' })).toBeDisabled();
	});
});
