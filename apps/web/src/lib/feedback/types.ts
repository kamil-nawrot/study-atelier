export type FeedbackKind = 'bug' | 'idea';

export type FeedbackDraft = {
	kind: FeedbackKind | null;
	title: string;
	description: string;
};

export type FeedbackErrors = {
	kind?: string;
	title?: string;
};
