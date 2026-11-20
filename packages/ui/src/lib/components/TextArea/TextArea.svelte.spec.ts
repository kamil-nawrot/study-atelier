import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '../../styles/index.css';
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

	it('grows at most to the given number of lines', async () => {
		render(TextArea, { label: 'Summary', rows: 2, maxRows: 3 });

		const field = page.getByRole('textbox', { name: 'Summary' });
		const textarea = field.element() as HTMLTextAreaElement;
		const twoLines = textarea.offsetHeight;
		textarea.style.height = '2000px';

		await expect.poll(() => textarea.offsetHeight).toBeLessThan(twoLines * 2);
		expect(textarea.offsetHeight).toBeGreaterThan(twoLines);
	});

	it('puts the counter in a strip under the text, inside the field', async () => {
		render(TextArea, { label: 'Summary', counter: true, maxlength: 10, value: 'Doric' });

		const textarea = page.getByRole('textbox', { name: 'Summary' }).element() as HTMLElement;
		const counter = page.getByText('5/10').element() as HTMLElement;
		const field = textarea.parentElement as HTMLElement;
		expect(counter.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			textarea.getBoundingClientRect().bottom - 0.5
		);
		expect(counter.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			field.getBoundingClientRect().bottom
		);
	});

	it('shows all the given lines of a field with a counter', async () => {
		render(TextArea, { label: 'Summary', counter: true, maxlength: 400, rows: 2, maxRows: 3 });

		const textarea = page.getByRole('textbox', { name: 'Summary' }).element() as HTMLTextAreaElement;
		textarea.style.height = '2000px';
		const style = getComputedStyle(textarea);
		const text =
			textarea.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

		await expect.poll(() => textarea.offsetHeight).toBeLessThan(2000);
		expect(text).toBeCloseTo(3 * parseFloat(style.lineHeight), 0);
	});

	it('keeps the field still and read-only, with text-sized lines, while it is being filled', async () => {
		render(TextArea, { label: 'Notes', filling: true, value: 'Old text' });

		const field = page.getByRole('textbox', { name: 'Notes' });
		await expect.element(field).toHaveAttribute('readonly');
		await expect.element(field).toBeEnabled();
		await expect.element(field).toHaveAttribute('aria-busy', 'true');
		expect(document.querySelectorAll('.filling-lines .line').length).toBeGreaterThan(1);
		expect(getComputedStyle(field.element()).color).toBe('rgba(0, 0, 0, 0)');
	});
});
