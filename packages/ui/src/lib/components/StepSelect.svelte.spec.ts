import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StepSelect, { type StepOption } from './StepSelect.svelte';

const levels: StepOption[] = [
	{ value: 'era', label: 'Era' },
	{ value: 'period', label: 'Period' },
	{ value: 'style', label: 'Style' }
];

function pressed(): boolean[] {
	return page
		.getByRole('button')
		.elements()
		.map((button) => button.getAttribute('aria-pressed') === 'true');
}

describe('StepSelect', () => {
	it('names the steps with its label and starts with none chosen', async () => {
		render(StepSelect, { label: 'Group by', steps: levels });

		await expect.element(page.getByRole('group', { name: 'Group by' })).toBeVisible();
		expect(pressed()).toEqual([false, false, false]);
	});

	it('presses the chosen step and every step above it', async () => {
		render(StepSelect, { label: 'Group by', steps: levels, value: 'period' });

		expect(pressed()).toEqual([true, true, false]);
	});

	it('goes down to the step the learner clicks, also from a deeper one', async () => {
		render(StepSelect, { label: 'Group by', steps: levels });

		await page.getByRole('button', { name: 'Style' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Style' }))
			.toHaveAttribute('aria-pressed', 'true');
		expect(pressed()).toEqual([true, true, true]);

		await page.getByRole('button', { name: 'Era' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Style' }))
			.toHaveAttribute('aria-pressed', 'false');
		expect(pressed()).toEqual([true, false, false]);
	});

	it('turns the deepest step off with a second click', async () => {
		render(StepSelect, { label: 'Group by', steps: levels, value: 'period' });

		await page.getByRole('button', { name: 'Period' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Period' }))
			.toHaveAttribute('aria-pressed', 'false');
		expect(pressed()).toEqual([true, false, false]);

		await page.getByRole('button', { name: 'Era' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Era' }))
			.toHaveAttribute('aria-pressed', 'false');
	});

	it('can be disabled', async () => {
		render(StepSelect, { label: 'Group by', steps: levels, disabled: true });

		await expect.element(page.getByRole('button', { name: 'Era' })).toBeDisabled();
	});
});
