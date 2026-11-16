import type { FlagItem } from './flag-item.ts';
import type { FlagQuestion } from './flag-question.ts';
import type { FlagReason } from './flag-reason.ts';

export type FlagDraft = {
	item: FlagItem;
	reason: FlagReason;
	comment: string;
	question?: FlagQuestion;
};
