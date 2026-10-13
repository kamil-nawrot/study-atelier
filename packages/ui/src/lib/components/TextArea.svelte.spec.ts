import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TextArea from './TextArea.svelte';

describe('TextArea', () => {
	it('takes several lines of text under its label', async () => {
		render(TextArea, { label: 'Notes' });

		const field = page.getByRole('textbox', { name: 'Notes' });
		await userEvent.type(field, 'First line{Enter}Second line');

		await expect.element(field).toHaveValue('First line\nSecond line');
	});

	it('describes the field with its hint', async () => {
		render(TextArea, { label: 'Notes', hint: 'Only you can see your notes.' });

		await expect
			.element(page.getByRole('textbox', { name: 'Notes' }))
			.toHaveAccessibleDescription('Only you can see your notes.');
	});

	it('marks the field invalid and shows the error instead of the hint', async () => {
		render(TextArea, { label: 'Notes', hint: 'Only you can see your notes.', error: 'Too long.' });

		const field = page.getByRole('textbox', { name: 'Notes' });
		await expect.element(field).toHaveAttribute('aria-invalid', 'true');
		await expect.element(field).toHaveAccessibleDescription('Too long.');
		await expect.element(page.getByText('Only you can see your notes.')).not.toBeInTheDocument();
	});
});
