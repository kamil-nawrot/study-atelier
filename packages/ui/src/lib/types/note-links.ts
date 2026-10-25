import type { NoteLinkTrigger } from './note-link-trigger';
import type { NoteLinkOption } from './note-link-option';

export type NoteLinks = {
	suggest: (trigger: NoteLinkTrigger, query: string) => NoteLinkOption[];
	resolve: (href: string) => string | undefined;
	minQueryLength?: number;
};
