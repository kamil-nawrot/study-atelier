import { getContext, setContext } from 'svelte';

export type AlertTone = 'danger' | 'warning' | 'success';

export type UiMessages = {
	alert: Record<AlertTone, string>;
	showPassword: string;
	hidePassword: string;
	removeTag: string;
	unknownAuthor: string;
	noImage: string;
	imageFailed: string;
	loading: string;
	clearSearch: string;
	closeDialog: string;
	notesEditor: {
		toolbar: string;
		bold: string;
		italic: string;
		heading: string;
		bulletedList: string;
		numberedList: string;
		linkValue: string;
		linkArtwork: string;
		linkSuggestions: string;
		noValueFound: string;
		noArtworkFound: string;
	};
	valueField: {
		existing: string;
		starter: string;
		similar: (name: string) => string;
		useSimilar: string;
		add: (name: string) => string;
		addAnyway: (name: string) => string;
		remove: (name: string) => string;
	};
	searchSelect: {
		empty: string;
		clear: (label: string) => string;
	};
};

export const defaultUiMessages: UiMessages = {
	alert: {
		danger: 'Error',
		warning: 'Warning',
		success: 'Done'
	},
	showPassword: 'Show',
	hidePassword: 'Hide',
	removeTag: 'Remove tag',
	unknownAuthor: 'Unknown author',
	noImage: 'No photo',
	imageFailed: 'The image did not load',
	loading: 'Loading',
	clearSearch: 'Clear search',
	closeDialog: 'Close',
	notesEditor: {
		toolbar: 'Formatting',
		bold: 'Bold',
		italic: 'Italic',
		heading: 'Heading',
		bulletedList: 'Bulleted list',
		numberedList: 'Numbered list',
		linkValue: 'Link a value',
		linkArtwork: 'Link an artwork',
		linkSuggestions: 'Link suggestions',
		noValueFound: 'No matching value.',
		noArtworkFound: 'No matching artwork.'
	},
	valueField: {
		existing: 'Already used',
		starter: 'From the starter list',
		similar: (name) => `You already have “${name}”`,
		useSimilar: 'Use this value',
		add: (name) => `+ Add “${name}”`,
		addAnyway: (name) => `+ Add “${name}” anyway`,
		remove: (name) => `Remove ${name}`
	},
	searchSelect: {
		empty: 'Nothing matches',
		clear: (label) => `Clear ${label}`
	}
};

const contextKey = Symbol('ui-messages');

export function setUiMessages(messages: UiMessages): void {
	setContext(contextKey, messages);
}

export function uiMessages(): UiMessages {
	return getContext<UiMessages | undefined>(contextKey) ?? defaultUiMessages;
}
