import { Editor } from '@tiptap/core';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';
import type { NoteLinkTrigger } from '../types/note-link-trigger';
import type { NoteLinks } from '../types/note-links';
import type { SuggestionState } from '../types/suggestion-state';
import { NoteLink, NoteLinkSuggestion } from '../note-link-extension/note-link-extension';

export type NotesEditorOptions = {
	element: HTMLElement;
	editable: boolean;
	content: string;
	attributes: () => Record<string, string>;
	links?: NoteLinks;
	onChange: (trigger: NoteLinkTrigger, state: SuggestionState | null) => void;
	onKeyDown: (event: KeyboardEvent) => boolean;
	onRefresh: (editor: Editor) => void;
	onValue: (editor: Editor) => void;
};

export function createNotesEditor(options: NotesEditorOptions): Editor {
	const { links } = options;
	return new Editor({
		element: options.element,
		editable: options.editable,
		content: options.content,
		extensions: [
			StarterKit.configure({
				blockquote: false,
				bulletList: {},
				code: false,
				codeBlock: false,
				dropcursor: false,
				gapcursor: false,
				heading: { levels: [3] },
				horizontalRule: false,
				link: false,
				strike: false,
				trailingNode: false,
				underline: false
			}),
			Markdown,
			NoteLink,
			NoteLinkSuggestion.configure({
				items: (trigger, query, signal) => links?.suggest(trigger, query, signal) ?? [],
				onChange: options.onChange,
				onKeyDown: options.onKeyDown
			})
		],
		editorProps: { attributes: options.attributes() },
		onCreate: ({ editor }) => options.onRefresh(editor),
		onSelectionUpdate: ({ editor }) => options.onRefresh(editor),
		onTransaction: ({ editor }) => options.onRefresh(editor),
		onUpdate: ({ editor }) => options.onValue(editor)
	});
}
