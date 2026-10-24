import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight, outlinedHeight } from '../../testing/control-height';
import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
import Select, { type SelectOption } from './Select.svelte';

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

	it('keeps its name for assistive technology when compact', async () => {
		render(Select, { label: 'Order', options: types, icon: ArrowUpDown, compact: true });

		await expect.element(page.getByRole('combobox', { name: 'Order' })).toBeInTheDocument();
	});

	it('shrinks to the icon on a phone and shows the chosen text on a larger screen', async () => {
		render(Select, {
			label: 'Order',
			options: types,
			icon: ArrowUpDown,
			compact: true,
			value: 'painting'
		});
		const control = page.getByRole('combobox', { name: 'Order' }).element().closest('.control');

		await page.viewport(400, 800);
		expect(control?.getBoundingClientRect().width).toBe(controlHeight());

		await page.viewport(1280, 800);
		expect(control?.getBoundingClientRect().width).toBeGreaterThan(controlHeight());
	});
});
