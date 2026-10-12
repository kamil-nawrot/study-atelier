import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NotesEditorValue from '../testing/NotesEditorValue.svelte';
import NotesEditor from './NotesEditor.svelte';

describe('NotesEditor', () => {
	it('shows the label and the five toolbar buttons', async () => {
		render(NotesEditor, { label: 'Notes' });

		await expect.element(page.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
		await expect.element(page.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
		for (const name of ['Bold', 'Italic', 'Heading', 'Bulleted list', 'Numbered list']) {
			await expect.element(page.getByRole('button', { name })).toBeInTheDocument();
		}
	});

	it('shows existing Markdown as formatted text', async () => {
		render(NotesEditor, { label: 'Notes', value: '### Light\n\nA **bold** word\n\n- one\n- two' });

		await expect.element(page.getByRole('heading', { name: 'Light' })).toBeInTheDocument();
		await expect.element(page.getByText('bold')).toBeInTheDocument();
		await expect.element(page.getByRole('listitem').first()).toHaveTextContent('one');
	});

	it('stores typed text as Markdown', async () => {
		render(NotesEditorValue);

		await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
		await userEvent.keyboard('Seen in **Delft**{Enter}- a{Enter}b');

		await expect.element(page.getByRole('status')).toHaveTextContent(/Seen in \*\*Delft\*\*/);
	});

	it('formats the selection with the toolbar and marks the pressed button', async () => {
		render(NotesEditor, { label: 'Notes' });

		await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
		await userEvent.click(page.getByRole('button', { name: 'Bold' }));
		await userEvent.keyboard('Strong');

		await expect
			.element(page.getByRole('button', { name: 'Bold' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText('Strong')).toBeInTheDocument();
	});

	it('turns a line into a heading and a list from the toolbar', async () => {
		render(NotesEditor, { label: 'Notes' });

		await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
		await userEvent.click(page.getByRole('button', { name: 'Heading' }));
		await userEvent.keyboard('Title{Enter}');
		await userEvent.click(page.getByRole('button', { name: 'Bulleted list' }));
		await userEvent.keyboard('First item');

		await expect.element(page.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
		await expect.element(page.getByRole('listitem')).toHaveTextContent('First item');
	});

	it('formats typed Markdown shortcuts', async () => {
		render(NotesEditor, { label: 'Notes' });

		await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
		await userEvent.keyboard('1. Alpha{Enter}Beta');

		await expect.element(page.getByRole('list')).toBeInTheDocument();
		await expect.element(page.getByRole('listitem').nth(1)).toHaveTextContent('Beta');
	});

	it('moves between toolbar buttons with the arrow keys and keeps one tab stop', async () => {
		render(NotesEditor, { label: 'Notes' });

		const bold = page.getByRole('button', { name: 'Bold' });
		(bold.element() as HTMLElement).focus();
		await userEvent.keyboard('{ArrowRight}');

		await expect.element(page.getByRole('button', { name: 'Italic' })).toHaveFocus();
		await expect
			.element(page.getByRole('button', { name: 'Bold' }))
			.toHaveAttribute('tabindex', '-1');
		await expect
			.element(page.getByRole('button', { name: 'Italic' }))
			.toHaveAttribute('tabindex', '0');
	});

	it('describes the field with its hint', async () => {
		render(NotesEditor, { label: 'Notes', hint: 'Only you can see this.' });

		await expect
			.element(page.getByRole('textbox', { name: 'Notes' }))
			.toHaveAccessibleDescription('Only you can see this.');
	});

	it('marks the field invalid and shows the error instead of the hint', async () => {
		render(NotesEditor, { label: 'Notes', hint: 'Only you can see this.', error: 'Too long.' });

		const field = page.getByRole('textbox', { name: 'Notes' });
		await expect.element(field).toHaveAttribute('aria-invalid', 'true');
		await expect.element(field).toHaveAccessibleDescription('Too long.');
	});

	it('is not editable when disabled', async () => {
		render(NotesEditor, { label: 'Notes', disabled: true });

		await expect
			.element(page.getByRole('textbox', { name: 'Notes' }))
			.toHaveAttribute('contenteditable', 'false');
		await expect.element(page.getByRole('button', { name: 'Bold' })).toBeDisabled();
	});

	it('shows the placeholder until something is typed', async () => {
		render(NotesEditor, { label: 'Notes', placeholder: 'What to remember' });

		await expect.element(page.getByText('What to remember')).toBeInTheDocument();
		await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
		await userEvent.keyboard('x');
		await expect.element(page.getByText('What to remember')).not.toBeInTheDocument();
	});
});
