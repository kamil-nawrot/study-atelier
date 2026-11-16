import type { FlagQuestion } from './flag-question.ts';
import type { FlagReason } from './flag-reason.ts';

export type FlagRecord = {
	id: string;
	reason: FlagReason;
	comment: string | null;
	question: FlagQuestion | null;
	artworkId: string | null;
	termId: string | null;
	symbolId: string | null;
	symbolName: string | null;
	imageNumber: number | null;
};
