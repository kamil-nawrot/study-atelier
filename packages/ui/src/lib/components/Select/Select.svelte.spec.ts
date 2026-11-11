import type { SelectOption } from '../../types/select-option';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight, outlinedHeight } from '../../testing/control-height';
import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
import Select from './Select.svelte';

const types: SelectOption[] = [
	{ value: 'painting', label: 'Painting' },
	{ value: 'sculpture', label: 'Sculpture' }
];

describe('Select', () => {
	it('shows the placeholder first and the options in order', async () => {
		render(Select, { label: 'Type', options: types, placeholder: 'Not chosen' });

		const select = page.getByRole('combobox', { name: 'Type' });
		await expect.element(select).toHaveDisplayValue('Not chosen');
		const labels = page
			.getByRole('option')
			.elements()
			.map((option) => option.textContent);
		expect(labels).toEqual(['Not chosen', 'Painting', 'Sculpture']);
	});

	it('keeps a hidden label as the name of the select', async () => {
		render(Select, { label: 'Month', options: types, placeholder: 'Month', hideLabel: true });

		await expect.element(page.getByRole('combobox', { name: 'Month' })).toBeVisible();
		const label = document.querySelector('label');
		expect(label?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
	});

	it('lets the learner choose an option', async () => {
		render(Select, { label: 'Type', options: types, placeholder: 'Not chosen' });

		const select = page.getByRole('combobox', { name: 'Type' });
		await userEvent.selectOptions(select, 'Sculpture');

		await expect.element(select).toHaveValue('sculpture');
	});

	it('shows the chosen value', async () => {
		render(Select, { label: 'Type', options: types, value: 'painting' });

		await expect
			.element(page.getByRole('combobox', { name: 'Type' }))
			.toHaveDisplayValue('Painting');
	});

	it('shows an error under the field instead of the hint', async () => {
		render(Select, {
			label: 'Type',
			options: types,
			hint: 'What kind of artwork it is.',
			error: 'Choose a type.'
		});

		const select = page.getByRole('combobox', { name: 'Type' });
		await expect.element(select).toHaveAttribute('aria-invalid', 'true');
		await expect.element(select).toHaveAccessibleDescription('Choose a type.');
		await expect.element(page.getByText('What kind of artwork it is.')).not.toBeInTheDocument();
	});

	it('shows the hint when there is no error', async () => {
		render(Select, { label: 'Type', options: types, hint: 'What kind of artwork it is.' });

		const select = page.getByRole('combobox', { name: 'Type' });
		await expect.element(select).toHaveAccessibleDescription('What kind of artwork it is.');
		await expect.element(select).not.toHaveAttribute('aria-invalid');
	});

	it('can be disabled', async () => {
		render(Select, { label: 'Type', options: types, disabled: true });

		await expect.element(page.getByRole('combobox', { name: 'Type' })).toBeDisabled();
	});

	it('is as high as every other control', async () => {
		render(Select, { label: 'Type', options: types });

		const select = page.getByRole('combobox', { name: 'Type' }).element();
		expect(outlinedHeight(select, '.control')).toBe(controlHeight());
	});

	it('uses the smaller text of a button on a computer and keeps the default on a phone when compact', async () => {
		render(Select, { label: 'Default', options: types });
		render(Select, { label: 'Compact', options: types, icon: ArrowUpDown, compact: true });

		const fontSize = (name: string): number =>
			parseFloat(getComputedStyle(page.getByRole('combobox', { name }).element()).fontSize);

		await page.viewport(400, 800);
		expect(fontSize('Compact')).toBe(fontSize('Default'));

		await page.viewport(1280, 800);
		expect(fontSize('Compact')).toBeLessThan(fontSize('Default'));
		await expect.element(page.getByText('Compact')).toBeVisible();
	});

	it('shows the icon before the chosen text', async () => {
		render(Select, { label: 'Order', options: types, icon: ArrowUpDown, value: 'painting' });
		const select = page.getByRole('combobox', { name: 'Order' }).element();
		const glyph = select.closest('.control')?.querySelector('.glyph svg');

		await page.viewport(1280, 800);
		expect(glyph?.getBoundingClientRect().width).toBeGreaterThan(0);
		expect(glyph?.getBoundingClientRect().right ?? 0).toBeLessThan(
			select.getBoundingClientRect().left + parseFloat(getComputedStyle(select).paddingLeft)
		);
	});

	it('shrinks to its icon on a phone with iconOnPhone and keeps the chosen value', async () => {
		await page.viewport(390, 844);
		render(Select, {
			label: 'Order',
			options: types,
			icon: ArrowUpDown,
			value: 'sculpture',
			hideLabel: true,
			iconOnPhone: true
		});
		const select = page.getByRole('combobox', { name: 'Order' });

		await expect.element(select).toHaveValue('sculpture');
		const control = select.element().closest('.control') as HTMLElement;
		expect(control.getBoundingClientRect().width).toBe(controlHeight());
		expect(getComputedStyle(select.element()).color).toBe('rgba(0, 0, 0, 0)');

		await page.viewport(1280, 800);
		await expect
			.poll(() => control.getBoundingClientRect().width)
			.toBeGreaterThan(controlHeight());
	});
});
