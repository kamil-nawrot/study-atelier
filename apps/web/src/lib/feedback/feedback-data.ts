import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { supabase } from '#lib/supabase.ts';
import { feedbackErrorMessage } from './errors.ts';
import type { FeedbackDraft } from './types.ts';

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
