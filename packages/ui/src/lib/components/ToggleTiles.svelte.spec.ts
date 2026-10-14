import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Flame from '@lucide/svelte/icons/flame';
import ToggleTiles from './ToggleTiles.svelte';

const options = [
	{ value: 'one', label: 'First', note: 'to 100', icon: Flame, count: 3 },
	{ value: 'two', label: 'Second', note: '100–200', count: 0 },
	{ value: 'three', label: 'Third', count: 5 }
];

describe('ToggleTiles', () => {
	it('shows a group named by its label with one checkbox per tile', async () => {
		render(ToggleTiles, { label: 'Era', options });

		await expect.element(page.getByRole('group', { name: 'Era' })).toBeVisible();
		await expect.element(page.getByRole('checkbox', { name: 'First to 100 3' })).not.toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: 'Second 100–200 0' })).toBeVisible();
		await expect.element(page.getByRole('checkbox', { name: 'Third 5' })).toBeVisible();
	});

	it('marks every chosen tile', async () => {
		render(ToggleTiles, { label: 'Era', options, values: ['one', 'three'] });

		await expect.element(page.getByRole('checkbox', { name: 'First to 100 3' })).toBeChecked();
		await expect
			.element(page.getByRole('checkbox', { name: 'Second 100–200 0' }))
			.not.toBeChecked();
		await expect.element(page.getByRole('checkbox', { name: 'Third 5' })).toBeChecked();
	});

	it('adds a tile to the choice and reports all chosen values', async () => {
		const onchange = vi.fn();
		render(ToggleTiles, { label: 'Era', options, values: ['one'], onchange });

		await userEvent.click(page.getByRole('checkbox', { name: 'Third 5' }));

		expect(onchange).toHaveBeenCalledExactlyOnceWith(['one', 'three']);
	});

	it('removes a chosen tile when it is clicked again', async () => {
		const onchange = vi.fn();
		render(ToggleTiles, { label: 'Era', options, values: ['one', 'three'], onchange });

		await userEvent.click(page.getByRole('checkbox', { name: 'First to 100 3' }));

		await expect.element(page.getByRole('checkbox', { name: 'First to 100 3' })).not.toBeChecked();
		expect(onchange).toHaveBeenCalledExactlyOnceWith(['three']);
	});
});
