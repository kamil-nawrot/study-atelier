import type { FlagReason } from './flag-reason.ts';

export type StoredFlag = {
	id: string;
	reason: FlagReason;
	comment: string | null;
	artworkId: string | null;
	termId: string | null;
	symbolId: string | null;
	imageId: string | null;
	pinId: string | null;
	holds: boolean;
	mode: string | null;
};
