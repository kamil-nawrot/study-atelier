import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Flame from '@lucide/svelte/icons/flame';
import ChoiceTiles, { type ChoiceTile } from './ChoiceTiles.svelte';

const options: ChoiceTile[] = [
	{ value: 'one', label: 'First', note: 'to 100', icon: Flame },
	{ value: 'two', label: 'Second', note: '100–200' },
	{ value: 'three', label: 'Third', note: 'from 200' }
];

describe('ChoiceTiles', () => {
	it('shows a radio group named by its label with one radio per tile', async () => {
		render(ChoiceTiles, { label: 'Era', options });

		await expect.element(page.getByRole('group', { name: 'Era' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'First to 100' })).not.toBeChecked();
		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Third from 200' })).toBeVisible();
	});

	it('marks the chosen tile', async () => {
		render(ChoiceTiles, { label: 'Era', options, value: 'two' });

		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).toBeChecked();
		await expect.element(page.getByRole('radio', { name: 'First to 100' })).not.toBeChecked();
	});

	it('chooses a tile when the learner clicks it and reports the choice', async () => {
		const onchange = vi.fn();
		render(ChoiceTiles, { label: 'Era', options, onchange });

		await userEvent.click(page.getByRole('radio', { name: 'Third from 200' }));

		await expect.element(page.getByRole('radio', { name: 'Third from 200' })).toBeChecked();
		expect(onchange).toHaveBeenCalledExactlyOnceWith('three');
	});

	it('moves the choice with the arrow keys', async () => {
		render(ChoiceTiles, { label: 'Era', options, value: 'one' });

		page.getByRole('radio', { name: 'First to 100' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');

		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).toBeChecked();
	});

	it('keeps the choice when the chosen tile is clicked again', async () => {
		const onchange = vi.fn();
		render(ChoiceTiles, { label: 'Era', options, value: 'two', onchange });

		await userEvent.click(page.getByRole('radio', { name: 'Second 100–200' }));

		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).toBeChecked();
		expect(onchange).not.toHaveBeenCalled();
	});

	it('clears the choice when a clearable chosen tile is clicked again', async () => {
		const onchange = vi.fn();
		render(ChoiceTiles, { label: 'Era', options, value: 'two', clearable: true, onchange });

		await userEvent.click(page.getByRole('radio', { name: 'Second 100–200' }));

		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).not.toBeChecked();
		expect(onchange).toHaveBeenCalledExactlyOnceWith(null);
	});

	it('clears a clearable choice with the space bar', async () => {
		render(ChoiceTiles, { label: 'Era', options, value: 'two', clearable: true });

		page.getByRole('radio', { name: 'Second 100–200' }).element().focus();
		await userEvent.keyboard(' ');

		await expect.element(page.getByRole('radio', { name: 'Second 100–200' })).not.toBeChecked();
	});

	it('cannot be changed when disabled', async () => {
		render(ChoiceTiles, { label: 'Era', options, disabled: true });

		await expect.element(page.getByRole('radio', { name: 'First to 100' })).toBeDisabled();
	});

	it('keeps every note on one line', async () => {
		render(ChoiceTiles, { label: 'Era', options });

		const note = page.getByText('100–200').element();
		expect(getComputedStyle(note).whiteSpace).toBe('nowrap');
	});

	it('lays the tiles in the given numbers of columns on wide and narrow space', async () => {
		const eight = Array.from({ length: 8 }, (_, index) => ({
			value: `v${index}`,
			label: `Tile ${index}`
		}));
		render(ChoiceTiles, { label: 'Type', options: eight, columns: 4, narrowColumns: 2 });
		const group = page.getByRole('group', { name: 'Type' }).element() as HTMLElement;
		const top = (index: number): number =>
			page
				.getByRole('radio', { name: `Tile ${index}` })
				.element()
				.getBoundingClientRect().top;

		group.style.width = '800px';
		await vi.waitFor(() => expect(top(3)).toBe(top(0)));
		expect(top(4)).toBeGreaterThan(top(0));

		group.style.width = '400px';
		await vi.waitFor(() => expect(top(2)).toBeGreaterThan(top(0)));
		expect(top(1)).toBe(top(0));
	});
});
