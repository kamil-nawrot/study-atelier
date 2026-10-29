import type { Editor } from '@tiptap/core';
import Bold from '@lucide/svelte/icons/bold';
import Heading from '@lucide/svelte/icons/heading';
import Italic from '@lucide/svelte/icons/italic';
import AtSign from '@lucide/svelte/icons/at-sign';
import Hash from '@lucide/svelte/icons/hash';
import List from '@lucide/svelte/icons/list';
import ListOrdered from '@lucide/svelte/icons/list-ordered';
import type { NoteLinkTrigger } from '../types/note-link-trigger';
import type { NotesCommand } from '../types/notes-command';
import type { UiMessages } from '../types/ui-messages';

export function startLink(editor: Editor, character: NoteLinkTrigger): void {
	const { from } = editor.state.selection;
	const before = editor.state.doc.textBetween(Math.max(1, from - 1), from, ' ', ' ');
	const prefix = before === '' || /\s/.test(before) ? '' : ' ';
	editor
		.chain()
		.focus()
		.insertContent(prefix + character)
		.run();
}

export function isBlank(editor: Editor): boolean {
	const { doc } = editor.state;
	return (
		doc.childCount === 1 && doc.firstChild?.type.name === 'paragraph' && doc.textContent === ''
	);
}

export function notesCommands(messages: UiMessages['notesEditor']): NotesCommand[] {
	return [
		{
			name: 'bold',
			label: messages.bold,
			icon: Bold,
			run: (editor) => editor.chain().focus().toggleBold().run(),
			active: (editor) => editor.isActive('bold')
		},
		{
			name: 'italic',
			label: messages.italic,
			icon: Italic,
			run: (editor) => editor.chain().focus().toggleItalic().run(),
			active: (editor) => editor.isActive('italic')
		},
		{
			name: 'heading',
			label: messages.heading,
			icon: Heading,
			run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
			active: (editor) => editor.isActive('heading')
		},
		{
			name: 'bulletList',
			label: messages.bulletedList,
			icon: List,
			run: (editor) => editor.chain().focus().toggleBulletList().run(),
			active: (editor) => editor.isActive('bulletList')
		},
		{
			name: 'orderedList',
			label: messages.numberedList,
			icon: ListOrdered,
			run: (editor) => editor.chain().focus().toggleOrderedList().run(),
			active: (editor) => editor.isActive('orderedList')
		},
		{
			name: 'linkValue',
			label: messages.linkValue,
			icon: AtSign,
			run: (editor) => startLink(editor, '@'),
			separated: true
		},
		{
			name: 'linkArtwork',
			label: messages.linkArtwork,
			icon: Hash,
			run: (editor) => startLink(editor, '#')
		}
	];
}
