import Pencil from '@lucide/svelte/icons/pencil';
import Trash from '@lucide/svelte/icons/trash-2';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ActionMenu from './ActionMenu.svelte';

describe('ActionMenu', () => {
	it('lists its actions under a named button and runs the chosen one', async () => {
		const onclick = vi.fn();
		render(ActionMenu, {
			label: 'Działania znaczenia „pokuta”',
			actions: [
				{ label: 'Edytuj', icon: Pencil, onclick },
				{ label: 'Usuń', icon: Trash, onclick: vi.fn(), danger: true },
				{ label: 'Przenieś', icon: Pencil, reason: 'Nie ma dokąd.' }
			]
		});

		await page.getByRole('button', { name: 'Działania znaczenia „pokuta”' }).click();
		await expect.element(page.getByText('Nie ma dokąd.')).toBeVisible();
		await page.getByRole('button', { name: 'Edytuj' }).click();

		expect(onclick).toHaveBeenCalled();
		await expect.element(page.getByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
	});
});
