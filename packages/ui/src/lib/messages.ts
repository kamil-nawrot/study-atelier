import { getContext, setContext } from 'svelte';

export type AlertTone = 'danger' | 'warning' | 'success';

export type UiMessages = {
	alert: Record<AlertTone, string>;
	showPassword: string;
	hidePassword: string;
	removeTag: string;
	unknownAuthor: string;
	noImage: string;
	clearSearch: string;
	valueField: {
		existing: string;
		starting: string;
		similar: (name: string) => string;
		useSimilar: string;
		add: (name: string) => string;
		addAnyway: (name: string) => string;
		remove: (name: string) => string;
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
	noImage: 'No image',
	clearSearch: 'Clear search',
	valueField: {
		existing: 'Already used',
		starting: 'Starting list',
		similar: (name) => `You already have “${name}”`,
		useSimilar: 'Use this value',
		add: (name) => `+ Add “${name}”`,
		addAnyway: (name) => `+ Add “${name}” anyway`,
		remove: (name) => `Remove ${name}`
	}
};

const contextKey = Symbol('ui-messages');

export function setUiMessages(messages: UiMessages): void {
	setContext(contextKey, messages);
}

export function uiMessages(): UiMessages {
	return getContext<UiMessages | undefined>(contextKey) ?? defaultUiMessages;
}
