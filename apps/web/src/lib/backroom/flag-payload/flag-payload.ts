import type { FlagDraft } from '#lib/backroom/types/flag-draft.ts';
import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';

export const FLAG_COMMENT_MAX = 200;

export type FlagPayload = {
	artwork_id?: string;
	term_id?: string;
	symbol_id?: string;
	image_id?: string;
	pin_id?: string;
	reason: FlagReason;
	comment: string | null;
	question?: FlagDraft['question'];
};

function itemColumns(item: FlagItem, reason: FlagReason): Partial<FlagPayload> {
	if (item.kind === 'term') return { term_id: item.id };
	if (item.kind === 'symbol') return { symbol_id: item.id };
	if (reason === 'pin' && item.pin) {
		return {
			artwork_id: item.id,
			image_id: item.pin.imageId,
			...(item.pin.id ? { pin_id: item.pin.id } : {})
		};
	}
	if (reason === 'image' && item.imageId) return { artwork_id: item.id, image_id: item.imageId };
	return { artwork_id: item.id };
}

export function commentMissing(draft: Pick<FlagDraft, 'reason' | 'comment'>): boolean {
	return draft.reason === 'other' && draft.comment.trim() === '';
}

export function flagPayload(draft: FlagDraft): FlagPayload {
	const comment = draft.comment.trim().slice(0, FLAG_COMMENT_MAX);
	return {
		...itemColumns(draft.item, draft.reason),
		reason: draft.reason,
		comment: comment === '' ? null : comment,
		...(draft.question ? { question: draft.question } : {})
	};
}
