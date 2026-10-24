import type { NoteLinkTrigger } from './note-link-trigger';
import type { NoteLinkOption } from './note-link-option';
import type { SuggestionState } from './suggestion-state';

export type NoteLinkSuggestionOptions = {
	items: (trigger: NoteLinkTrigger, query: string) => NoteLinkOption[];
	onChange: (trigger: NoteLinkTrigger, state: SuggestionState | null) => void;
	onKeyDown: (event: KeyboardEvent) => boolean;
};
