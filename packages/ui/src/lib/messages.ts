import { getContext, setContext } from 'svelte';

export type AlertTone = 'danger' | 'warning' | 'success';

export type UiMessages = {
	alert: Record<AlertTone, string>;
	showPassword: string;
	hidePassword: string;
	removeTag: string;
	unknownAuthor: string;
	noImage: string;
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
	noImage: 'No image'
};

const contextKey = Symbol('ui-messages');

export function setUiMessages(messages: UiMessages): void {
	setContext(contextKey, messages);
}

export function uiMessages(): UiMessages {
	return getContext<UiMessages | undefined>(contextKey) ?? defaultUiMessages;
}
