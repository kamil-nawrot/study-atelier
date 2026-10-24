import type { AlertTone } from './alert-tone';

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
