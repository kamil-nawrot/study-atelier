import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { controlHeight, outlinedHeight } from '../testing/control-height';
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
});
