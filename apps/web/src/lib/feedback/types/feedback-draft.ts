import type { FeedbackKind } from './feedback-kind.ts';

export type FeedbackDraft = {
	kind: FeedbackKind | null;
	title: string;
	description: string;
};
