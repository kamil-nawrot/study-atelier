import Pencil from '@lucide/svelte/icons/pencil';
import Trash from '@lucide/svelte/icons/trash-2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import ActionMenu from './ActionMenu.svelte';

describe('ActionMenu', () => {
	beforeEach(() => {
		document.body.style.paddingLeft = '400px';
	});

	afterEach(() => {
		document.body.style.paddingLeft = '';
	});

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

	it('opens a bare menu right under its button, aligned to its right edge', async () => {
		await page.viewport(1280, 800);
		render(ActionMenu, {
			label: 'Działania',
			bare: true,
			actions: [{ label: 'Edytuj', icon: Pencil, onclick: vi.fn() }]
		});

		const trigger = page.getByRole('button', { name: 'Działania' });
		await trigger.click();
		await expect.element(page.getByRole('button', { name: 'Edytuj' })).toBeVisible();

		const button = trigger.element().getBoundingClientRect();
		const panel = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
		expect(panel).toBeDefined();
		expect(Math.abs((panel?.right ?? 0) - button.right)).toBeLessThan(2);
		expect((panel?.top ?? 0) - button.bottom).toBeGreaterThanOrEqual(0);
		expect((panel?.top ?? 0) - button.bottom).toBeLessThan(16);
	});
});
