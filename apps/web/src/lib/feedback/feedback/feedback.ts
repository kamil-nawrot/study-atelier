import { m } from '#lib/i18n/i18n.ts';
import type { FeedbackDraft, FeedbackErrors } from '#lib/feedback/types.ts';

export const FEEDBACK_TITLE_MAX = 120;
export const FEEDBACK_DESCRIPTION_MAX = 4000;

export const emptyFeedback: FeedbackDraft = { kind: null, title: '', description: '' };

export function validateFeedback(draft: FeedbackDraft): FeedbackErrors {
	const errors: FeedbackErrors = {};
	if (!draft.kind) errors.kind = m.feedback.errors.kindRequired;
	if (draft.title.trim() === '') errors.title = m.feedback.errors.titleRequired;
	return errors;
}

export function hasFeedbackErrors(errors: FeedbackErrors): boolean {
	return Object.keys(errors).length > 0;
}
