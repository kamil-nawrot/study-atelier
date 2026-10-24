import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { NoteLinks } from '../../note-links/note-links';
import NotesEditorValue from '../../testing/NotesEditorValue.svelte';
import NotesEditor from './NotesEditor.svelte';

const baroque = '/atelier/values/period/9b2f6c1e-0000-4000-8000-000000000001';
const dama = '/atelier/7';

const links: NoteLinks = {
	suggest: (trigger, query) => {
		const all =
			trigger === '@'
				? [
						{ href: baroque, name: 'barok', detail: 'Period' },
						{ href: '/atelier/values/author/a1', name: 'Fra Bartolommeo', detail: 'Author' }
					]
				: [{ href: dama, name: '#0007 Lady with an Ermine', detail: 'Leonardo da Vinci' }];
		return all.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
	},
	resolve: (href) =>
		href === baroque ? 'barok' : href === dama ? '#0007 Lady with an Ermine' : undefined
};

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

	it.each(['Bulleted list', 'Numbered list'])(
		'hides the placeholder when %s is the only content',
		async (name) => {
			render(NotesEditor, { label: 'Notes', placeholder: 'What to remember' });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.click(page.getByRole('button', { name }));

			await expect.element(page.getByText('What to remember')).not.toBeInTheDocument();
		}
	);

	describe('links', () => {
		it('offers the two link buttons only after a separator and as plain buttons', async () => {
			render(NotesEditor, { label: 'Notes', links });

			await expect.element(page.getByRole('separator')).toBeInTheDocument();
			for (const name of ['Link a value', 'Link an artwork']) {
				const button = page.getByRole('button', { name });
				await expect.element(button).toBeInTheDocument();
				await expect.element(button).not.toHaveAttribute('aria-pressed');
			}
		});

		it('lists values after @ and stores the picked one as a Markdown link', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('Like in @ba');

			await expect.element(page.getByRole('option', { name: /barok/ })).toBeInTheDocument();
			await expect
				.element(page.getByRole('option', { name: /Fra Bartolommeo/ }))
				.toBeInTheDocument();
			await userEvent.keyboard('{ArrowDown}{Enter}');

			await expect
				.element(page.getByRole('status'))
				.toHaveTextContent(String.raw`Like in [Fra Bartolommeo](/atelier/values/author/a1)`);
			await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		});

		it('waits for the minimum query length before listing', async () => {
			render(NotesEditorValue, { links: { ...links, minQueryLength: 2 } });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('@b');
			await expect.element(page.getByRole('option').first()).not.toBeInTheDocument();
			await userEvent.keyboard('a');
			await expect.element(page.getByRole('option', { name: /barok/ })).toBeInTheDocument();
		});

		it('lists artworks after # and picks one by a click', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('See #');
			await page.getByRole('option', { name: /0007/ }).click();

			await expect
				.element(page.getByRole('status'))
				.toHaveTextContent('See [#0007 Lady with an Ermine](/atelier/7)');
		});

		it('opens the list from the toolbar button, after a space when the cursor follows a word', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('word');
			await userEvent.click(page.getByRole('button', { name: 'Link a value' }));

			await expect.element(page.getByRole('option', { name: /barok/ })).toBeInTheDocument();
			await expect
				.element(page.getByRole('textbox', { name: 'Notes' }))
				.toHaveTextContent('word @');
		});

		it('says nothing matches and closes with Escape', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('@zzz');

			await expect.element(page.getByText('No matching value.')).toBeInTheDocument();
			await userEvent.keyboard('{Escape}');
			await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		});

		it('closes the list when a query with a space matches nothing', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('@zzz yyy');

			await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
			await expect
				.element(page.getByRole('textbox', { name: 'Notes' }))
				.toHaveTextContent('@zzz yyy');
		});

		it('does not open a list inside a word such as an e-mail address', async () => {
			render(NotesEditorValue, { links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('jan@ba');

			await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
		});

		it('shows a stored link with the current name and keeps the address when saving', async () => {
			render(NotesEditorValue, {
				links,
				initial: `Older [old name](${baroque}) and [gone](/atelier/values/style/zzz).`
			});

			await expect
				.element(page.getByRole('textbox', { name: 'Notes' }).getByText('barok'))
				.toBeInTheDocument();
			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('{End} More');

			await expect
				.element(page.getByRole('status'))
				.toHaveTextContent(
					String.raw`Older [barok](${baroque}) and [gone](/atelier/values/style/zzz). More`
				);
		});

		it('deletes a link as one unit with Backspace', async () => {
			render(NotesEditorValue, { links, initial: `A [old](${baroque})` });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('{End}{Backspace}');

			await expect.element(page.getByRole('status')).toHaveTextContent(/^"A\s*"$/);
		});

		it('still turns ### at the start of a line into a heading', async () => {
			render(NotesEditor, { label: 'Notes', links });

			await userEvent.click(page.getByRole('textbox', { name: 'Notes' }));
			await userEvent.keyboard('### Light');

			await expect.element(page.getByRole('heading', { name: 'Light' })).toBeInTheDocument();
		});

		it('describes the list for assistive technology', async () => {
			render(NotesEditorValue, { links });

			const textbox = page.getByRole('textbox', { name: 'Notes' });
			await userEvent.click(textbox);
			await expect.element(textbox).toHaveAttribute('aria-expanded', 'false');
			await userEvent.keyboard('@b');

			await expect.element(textbox).toHaveAttribute('aria-expanded', 'true');
			await expect
				.element(page.getByRole('listbox', { name: 'Link suggestions' }))
				.toBeInTheDocument();
		});
	});
});
