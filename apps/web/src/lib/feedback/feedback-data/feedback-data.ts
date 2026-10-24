import { failureMessage } from '#lib/auth/expired-session/expired-session.svelte.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { feedbackErrorMessage } from '#lib/feedback/errors/errors.ts';
import type { FeedbackDraft } from '#lib/feedback/types/feedback-draft.ts';

export type FeedbackSendResult = {
	error?: string;
};

export async function sendFeedback(draft: FeedbackDraft): Promise<FeedbackSendResult> {
	if (!draft.kind) return { error: feedbackErrorMessage({ code: '23514' }) };
	const description = draft.description.trim();
	const { error } = await supabase.from('feedback').insert({
		kind: draft.kind,
		title: draft.title.trim(),
		description: description === '' ? null : description
	});
	return error ? { error: await failureMessage(error, feedbackErrorMessage) } : {};
}
