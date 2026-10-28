import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight, outlinedHeight } from '../../testing/control-height';
import TextField from './TextField.svelte';

const action = createRawSnippet(() => ({ render: () => '<button type="button">Use</button>' }));

describe('TextField', () => {
	it('is as high as every other control', async () => {
		render(TextField, { label: 'Title' });

		const input = page.getByRole('textbox', { name: 'Title' }).element();
		expect(outlinedHeight(input, '.control')).toBe(controlHeight());
	});

	it('keeps its action beside the input when an error shows', async () => {
		render(TextField, { label: 'Image address', error: 'Paste a full address.', action });

		const input = page.getByRole('textbox', { name: 'Image address' }).element();
		const button = page.getByRole('button', { name: 'Use' }).element();
		const field = input.closest('.control')!.getBoundingClientRect();
		expect(button.getBoundingClientRect().top).toBe(field.top);
		expect(button.getBoundingClientRect().height).toBe(field.height);
	});

	it('names the input without a visible label when the label is hidden', async () => {
		render(TextField, { label: 'From', hideLabel: true, placeholder: 'From' });

		await expect.element(page.getByRole('textbox', { name: 'From' })).toBeVisible();
		expect(document.querySelector('label')).toBeNull();
	});

	it('locks the field and primes it while it is being filled', async () => {
		render(TextField, { label: 'Year', filling: true });

		const field = page.getByRole('textbox', { name: 'Year' });
		await expect.element(field).toBeDisabled();
		await expect.element(field).toHaveAttribute('aria-busy', 'true');
		expect(document.querySelector('.primer')).not.toBeNull();
	});
});
