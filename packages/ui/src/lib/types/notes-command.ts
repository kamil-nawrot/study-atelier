import type { Editor } from '@tiptap/core';
import type { LucideIcon } from '@lucide/svelte';

export type NotesCommand = {
	name: 'bold' | 'italic' | 'heading' | 'bulletList' | 'orderedList' | 'linkValue' | 'linkArtwork';
	label: string;
	icon: LucideIcon;
	run: (editor: Editor) => void;
	active?: (editor: Editor) => boolean;
	separated?: boolean;
};
