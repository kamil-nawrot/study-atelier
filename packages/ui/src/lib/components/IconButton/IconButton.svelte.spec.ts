import { describe, expect, it, vi } from 'vitest';
import Pencil from '@lucide/svelte/icons/pencil';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
import IconButton from './IconButton.svelte';

describe('IconButton', () => {
	it('is named by its label and shows the label as a tooltip', async () => {
		render(IconButton, { icon: Pencil, label: 'Change photo' });

		await expect.element(page.getByRole('button', { name: 'Change photo' })).toBeVisible();
		await expect.element(page.getByText('Change photo', { exact: true })).not.toBeVisible();

		await userEvent.hover(page.getByRole('button', { name: 'Change photo' }));

		await expect.element(page.getByRole('tooltip')).toBeVisible();
	});

	it('calls onclick', async () => {
		const onclick = vi.fn();
		render(IconButton, { icon: Pencil, label: 'Change photo', onclick });

		await page.getByRole('button', { name: 'Change photo' }).click();

		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('is disabled when asked to be', async () => {
		render(IconButton, { icon: Pencil, label: 'Change photo', disabled: true });

		await expect.element(page.getByRole('button', { name: 'Change photo' })).toBeDisabled();
	});
});
