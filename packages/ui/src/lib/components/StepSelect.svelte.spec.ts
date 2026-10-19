import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight } from '../testing/control-height';
import StepSelect, { type StepOption } from './StepSelect.svelte';

const levels: StepOption[] = [
	{ value: 'none', label: 'No grouping' },
	{ value: 'era', label: 'Era' },
	{ value: 'period', label: 'Period' },
	{ value: 'style', label: 'Style' }
];

describe('StepSelect', () => {
	it('shows the chosen step on the button and opens the steps on a click', async () => {
		render(StepSelect, { label: 'Grouping', options: levels, value: 'era' });

		const button = page.getByRole('combobox', { name: 'Grouping' });
		await expect.element(button).toHaveTextContent('Era');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');

		await button.click();

		await expect.element(button).toHaveAttribute('aria-expanded', 'true');
		const labels = page
			.getByRole('option')
			.elements()
			.map((option) => option.textContent?.trim());
		expect(labels).toEqual(['No grouping', 'Era', 'Period', 'Style']);
	});

	it('chooses a step with a click and closes', async () => {
		render(StepSelect, { label: 'Grouping', options: levels });

		await page.getByRole('combobox', { name: 'Grouping' }).click();
		await page.getByRole('option', { name: 'Period' }).click();

		const button = page.getByRole('combobox', { name: 'Grouping' });
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
		await expect.element(button).toHaveTextContent('Period');
	});

	it('marks the chosen step and the steps above it, but not the first one', async () => {
		render(StepSelect, { label: 'Grouping', options: levels, value: 'period' });

		await page.getByRole('combobox', { name: 'Grouping' }).click();

		const included = page
			.getByRole('option')
			.elements()
			.map((option) => option.classList.contains('included'));
		expect(included).toEqual([false, true, true, false]);
		await expect
			.element(page.getByRole('option', { name: 'Period' }))
			.toHaveAttribute('aria-selected', 'true');
	});

	it('is driven by the keyboard', async () => {
		render(StepSelect, { label: 'Grouping', options: levels });

		const button = page.getByRole('combobox', { name: 'Grouping' });
		(button.element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');

		await expect.element(button).toHaveTextContent('Period');
		await userEvent.keyboard('{ArrowDown}{Escape}');
		await expect.element(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('shows a summary instead of the label of the step', async () => {
		render(StepSelect, {
			label: 'Grouping',
			options: levels,
			value: 'style',
			summary: 'Eras › periods › styles'
		});

		await expect
			.element(page.getByRole('combobox', { name: 'Grouping' }))
			.toHaveTextContent('Eras › periods › styles');
	});

	it('lays the steps out as radio buttons when inline', async () => {
		render(StepSelect, { label: 'Grouping', options: levels, inline: true });

		await expect.element(page.getByRole('group', { name: 'Grouping' })).toBeVisible();
		await page.getByText('Style').click();

		await expect.element(page.getByRole('radio', { name: 'Style' })).toBeChecked();
	});

	it('is as high as every other control', async () => {
		render(StepSelect, { label: 'Grouping', options: levels });

		const button = page.getByRole('combobox', { name: 'Grouping' }).element() as HTMLElement;
		expect(button.getBoundingClientRect().height).toBe(controlHeight());
	});
});
