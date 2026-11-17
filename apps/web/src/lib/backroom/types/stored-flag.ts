import type { FlagQuestion } from './flag-question.ts';
import type { FlagReason } from './flag-reason.ts';

export type StoredFlag = {
	id: string;
	reason: FlagReason;
	comment: string | null;
	artworkId: string | null;
	termId: string | null;
	symbolId: string | null;
	eventId: string | null;
	imageId: string | null;
	imageNumber: number | null;
	pinId: string | null;
	holds: boolean;
	question: FlagQuestion | null;
	mode: string | null;
};
