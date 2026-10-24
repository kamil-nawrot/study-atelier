import type { NoteLinkTrigger } from './note-link-trigger';
import type { NoteLinkOption } from './note-link-option';

export type SuggestionState = {
	trigger: NoteLinkTrigger;
	query: string;
	items: NoteLinkOption[];
	loading: boolean;
	choose: (option: NoteLinkOption) => void;
};
