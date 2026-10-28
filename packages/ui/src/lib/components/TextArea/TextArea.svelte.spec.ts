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

	it('counts the characters against the limit when asked', async () => {
		render(TextArea, { label: 'Summary', counter: true, maxlength: 10, value: 'Doric' });

		const field = page.getByRole('textbox', { name: 'Summary' });
		await expect.element(field).toHaveAccessibleDescription('5/10');
		await userEvent.type(field, ' order');

		await expect.element(field).toHaveValue('Doric orde');
		await expect.element(page.getByText('10/10')).toBeVisible();
	});

	it('shows no counter without a limit', async () => {
		render(TextArea, { label: 'Summary', counter: true, value: 'Doric' });

		await expect.element(page.getByText('5/', { exact: false })).not.toBeInTheDocument();
	});

	it('locks the field and primes it while it is being filled', async () => {
		render(TextArea, { label: 'Notes', filling: true });

		const field = page.getByRole('textbox', { name: 'Notes' });
		await expect.element(field).toBeDisabled();
		await expect.element(field).toHaveAttribute('aria-busy', 'true');
		expect(document.querySelector('.primer')).not.toBeNull();
	});
});
